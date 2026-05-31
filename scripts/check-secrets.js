#!/usr/bin/env node
/* eslint-disable no-undef */

const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const excludedPathPrefixes = ['agent-knowledge/', 'docs/', 'node_modules/', 'playwright-report/'];

const excludedPaths = new Set(['.env.example']);

const tokenPatterns = [
  { name: 'OpenAI API key', pattern: /sk-[A-Za-z0-9_-]{20,}/g },
  { name: 'AWS access key', pattern: /AKIA[0-9A-Z]{16}/g },
  { name: 'Google API key', pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'GitHub token', pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/g },
  { name: 'Slack token', pattern: /xox[baprs]-[A-Za-z0-9-]{20,}/g },
  {
    name: 'Private key',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g,
  },
];

const sensitiveAssignments =
  /\b(?:DATABASE_URL|REDIS_URL|JWT_SECRET|JWT_RESET_SECRET|OPENAI_API_KEY|GEMINI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)\s*[:=]\s*["']?([^"'\s]+)/g;

const placeholderValues = [
  'your_',
  'your-',
  'change-me',
  'changeme',
  'example',
  'placeholder',
  'test-',
  'test_',
  'ci-',
  'ci_',
  'original',
  'schema',
  'localhost',
  '127.0.0.1',
  'z.',
  '${',
  '<',
];

function listTrackedFiles() {
  return execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
    .split('\0')
    .filter(Boolean)
    .filter((file) => !excludedPaths.has(file))
    .filter((file) => !excludedPathPrefixes.some((prefix) => file.startsWith(prefix)));
}

function shouldScan(file) {
  return /\.(cjs|css|js|json|jsx|mdx|mjs|ts|tsx|yaml|yml)$/.test(file);
}

function isPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  return placeholderValues.some((placeholder) => normalized.includes(placeholder));
}

const findings = [];

for (const file of listTrackedFiles()) {
  if (!shouldScan(file)) continue;

  const content = readFileSync(file, 'utf8');

  for (const { name, pattern } of tokenPatterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      findings.push({ file, name, value: match[0].slice(0, 12) });
    }
  }

  sensitiveAssignments.lastIndex = 0;
  for (const match of content.matchAll(sensitiveAssignments)) {
    const value = match[1];
    if (!isPlaceholder(value)) {
      findings.push({ file, name: 'Sensitive environment assignment', value: value.slice(0, 12) });
    }
  }
}

if (findings.length > 0) {
  console.error(`secret scan failed (${findings.length} finding(s))`);
  for (const finding of findings) {
    console.error(`- ${finding.file}: ${finding.name} (${finding.value}...)`);
  }
  process.exit(1);
}

console.log('secret scan passed');
