#!/usr/bin/env node
/* eslint-disable no-undef */

const { performance } = require('node:perf_hooks');

const DEFAULT_DURATION_SECONDS = 30;
const DEFAULT_CONCURRENCY = 4;
const SUCCESS_STATUS_MIN = 200;
const SUCCESS_STATUS_MAX = 399;

const scenarios = [
  { name: 'health-ready', method: 'GET', path: '/api/health/ready', requiresAuth: false },
  {
    name: 'public-catalog',
    method: 'GET',
    path: '/api/public/courses?page=1&limit=12',
    requiresAuth: false,
    needsOrigin: true,
  },
  { name: 'course-list', method: 'GET', path: '/api/courses?page=1&limit=20', requiresAuth: true },
  {
    name: 'practice-sets',
    method: 'GET',
    path: '/api/practice/exercise-sets?page=1&limit=20',
    requiresAuth: true,
  },
  { name: 'exam-list', method: 'GET', path: '/api/exams?page=1&limit=20', requiresAuth: true },
  {
    name: 'reports-risk-flags',
    method: 'GET',
    path: '/api/admin/reports/risk-flags?page=1&limit=20',
    requiresAuth: true,
  },
];

function parseArgs(argv) {
  const options = {
    baseUrl: process.env.LMS_LOAD_API_URL || 'http://localhost:4000',
    origin: process.env.LMS_LOAD_ORIGIN || '',
    authCookie: process.env.LMS_LOAD_AUTH_COOKIE || '',
    durationSeconds: DEFAULT_DURATION_SECONDS,
    concurrency: DEFAULT_CONCURRENCY,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    const value = argv[index + 1];

    if (key === '--base-url' && value) {
      options.baseUrl = value;
      index += 1;
    } else if (key === '--origin' && value) {
      options.origin = value;
      index += 1;
    } else if (key === '--auth-cookie' && value) {
      options.authCookie = value;
      index += 1;
    } else if (key === '--duration-seconds' && value) {
      options.durationSeconds = toPositiveInteger(value, DEFAULT_DURATION_SECONDS);
      index += 1;
    } else if (key === '--concurrency' && value) {
      options.concurrency = toPositiveInteger(value, DEFAULT_CONCURRENCY);
      index += 1;
    }
  }

  return options;
}

function toPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRunnableScenarios(options) {
  return scenarios.filter((scenario) => {
    if (scenario.requiresAuth && !options.authCookie) return false;
    if (scenario.needsOrigin && !options.origin) return false;
    return true;
  });
}

function buildHeaders(scenario, options) {
  const headers = {
    accept: 'application/json',
    'user-agent': 'lms-load-baseline/1.0',
  };

  if (scenario.needsOrigin && options.origin) {
    headers.origin = options.origin;
  }

  if (scenario.requiresAuth && options.authCookie) {
    headers.cookie = options.authCookie;
  }

  return headers;
}

async function requestScenario(scenario, options) {
  const startedAt = performance.now();
  const response = await fetch(new URL(scenario.path, options.baseUrl), {
    method: scenario.method,
    headers: buildHeaders(scenario, options),
  });
  const durationMs = performance.now() - startedAt;
  const ok = response.status >= SUCCESS_STATUS_MIN && response.status <= SUCCESS_STATUS_MAX;

  await response.arrayBuffer();

  return {
    name: scenario.name,
    status: response.status,
    durationMs,
    ok,
  };
}

function percentile(values, percentage) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.ceil((percentage / 100) * sorted.length) - 1);
  return sorted[index];
}

function summarize(results, skipped) {
  const byScenario = new Map();

  for (const result of results) {
    const current = byScenario.get(result.name) || [];
    current.push(result);
    byScenario.set(result.name, current);
  }

  return {
    totalRequests: results.length,
    skippedScenarios: skipped,
    scenarios: [...byScenario.entries()].map(([name, scenarioResults]) => {
      const durations = scenarioResults.map((result) => result.durationMs);
      const failures = scenarioResults.filter((result) => !result.ok).length;
      const statusCounts = scenarioResults.reduce((accumulator, result) => {
        const key = String(result.status);
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {});

      return {
        name,
        requests: scenarioResults.length,
        failureRate: failures / scenarioResults.length,
        averageMs: average(durations),
        p95Ms: percentile(durations, 95),
        p99Ms: percentile(durations, 99),
        statusCounts,
      };
    }),
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

async function runWorker(workerId, deadlineMs, runnableScenarios, options, results) {
  let index = workerId;

  while (performance.now() < deadlineMs) {
    const scenario = runnableScenarios[index % runnableScenarios.length];
    index += 1;

    try {
      results.push(await requestScenario(scenario, options));
    } catch {
      results.push({
        name: scenario.name,
        status: 0,
        durationMs: 0,
        ok: false,
      });
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const runnableScenarios = getRunnableScenarios(options);
  const skipped = scenarios
    .filter((scenario) => !runnableScenarios.includes(scenario))
    .map((scenario) => scenario.name);

  if (runnableScenarios.length === 0) {
    console.error('No runnable load scenarios. Check base URL and auth cookie options.');
    process.exit(1);
  }

  const deadlineMs = performance.now() + options.durationSeconds * 1000;
  const results = [];
  const workers = Array.from({ length: options.concurrency }, (_, index) =>
    runWorker(index, deadlineMs, runnableScenarios, options, results),
  );

  await Promise.all(workers);

  const summary = summarize(results, skipped);
  console.log(JSON.stringify(summary, null, 2));

  const failedScenarios = summary.scenarios.filter((scenario) => scenario.failureRate > 0);
  if (failedScenarios.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
