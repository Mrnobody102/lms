/* global URL, console, process, require */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DEFAULT_ENV_FILE = '.env.production';
const DEFAULT_DEPLOYMENT_TOPOLOGY = 'docker';
const SUPPORTED_DEPLOYMENT_TOPOLOGIES = new Set(['docker', 'vercel-render']);
const PLACEHOLDER_PATTERN =
  /(change[_-]?me|your[_-]?secure|local[_-]?build|localhost|test[_-]?jwt|dev[_-]?jwt)/i;

function parseArgs(argv) {
  const result = { file: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--file') {
      result.file = argv[index + 1] || null;
      index += 1;
    }
  }
  return result;
}

function parseEnvFile(filePath) {
  const env = {};
  const source = fs.readFileSync(filePath, 'utf8');

  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;

    const key = trimmed.slice(0, equalsIndex).trim();
    let value = trimmed.slice(equalsIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

function getEnv() {
  const args = parseArgs(process.argv.slice(2));
  const selectedFile = args.file
    ? path.resolve(ROOT, args.file)
    : path.join(ROOT, DEFAULT_ENV_FILE);

  if (fs.existsSync(selectedFile)) {
    return {
      source: path.relative(ROOT, selectedFile).split(path.sep).join('/'),
      values: parseEnvFile(selectedFile),
    };
  }

  if (args.file) {
    return {
      error: `${args.file}: env file does not exist`,
      source: args.file,
      values: {},
    };
  }

  return {
    source: 'process.env',
    values: process.env,
  };
}

function isPresent(env, key) {
  return typeof env[key] === 'string' && env[key].trim().length > 0;
}

function booleanValue(env, key) {
  return isPresent(env, key) && env[key].trim().toLowerCase() === 'true';
}

function assertOptionalBoolean(env, key, errors) {
  if (!isPresent(env, key)) return;

  const value = env[key].trim().toLowerCase();
  if (value !== 'true' && value !== 'false') {
    errors.push(`${key} must be true or false`);
  }
}

function assertRequired(env, key, errors) {
  if (!isPresent(env, key)) {
    errors.push(`${key} is required for production`);
  }
}

function assertSecret(env, key, errors) {
  assertRequired(env, key, errors);
  if (!isPresent(env, key)) return;

  const value = env[key].trim();
  if (value.length < 32) {
    errors.push(`${key} must be at least 32 characters`);
  }
  if (PLACEHOLDER_PATTERN.test(value)) {
    errors.push(`${key} appears to be a placeholder or local-only value`);
  }
}

function parseExactOrigin(value) {
  const parsed = new URL(value);
  if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || parsed.pathname !== '/') {
    throw new Error('invalid origin');
  }
  if (parsed.search || parsed.hash || value.includes('*')) {
    throw new Error('invalid origin');
  }
  return parsed.origin;
}

function getOrigins(env) {
  if (!isPresent(env, 'CORS_ORIGINS')) return [];
  return env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      try {
        return parseExactOrigin(origin);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function assertOrigins(env, errors) {
  assertRequired(env, 'CORS_ORIGINS', errors);
  if (!isPresent(env, 'CORS_ORIGINS')) return;

  const origins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (origins.length === 0) {
    errors.push('CORS_ORIGINS must contain at least one exact origin');
    return;
  }

  for (const origin of origins) {
    try {
      parseExactOrigin(origin);
    } catch {
      errors.push('CORS_ORIGINS must contain only exact http(s) origins without path/query/hash');
      return;
    }
  }
}

function assertOriginInCors(env, key, errors) {
  if (!isPresent(env, key) || !isPresent(env, 'CORS_ORIGINS')) return;

  let origin;
  try {
    origin = parseExactOrigin(env[key].trim());
  } catch {
    return;
  }

  if (!getOrigins(env).includes(origin)) {
    errors.push(`${key} (${origin}) must be included in CORS_ORIGINS`);
  }
}

function assertOptionalOrigin(env, key, errors) {
  if (!isPresent(env, key)) return;
  try {
    parseExactOrigin(env[key].trim());
  } catch {
    errors.push(`${key} must be an exact http(s) origin without path/query/hash`);
  }
}

function assertHttpsOrigin(env, key, errors) {
  if (!isPresent(env, key)) return;

  try {
    const parsed = new URL(env[key].trim());
    if (parsed.protocol !== 'https:') {
      errors.push(`${key} must use https in production`);
    }
  } catch {
    // The origin shape is reported by assertOptionalOrigin.
  }
}

function assertOptionalUrl(env, key, errors) {
  if (!isPresent(env, key)) return;
  try {
    const parsed = new URL(env[key].trim());
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('invalid URL');
    }
  } catch {
    errors.push(`${key} must be a valid http(s) URL`);
  }
}

function assertOptionalNumber(env, key, min, max, errors) {
  if (!isPresent(env, key)) return;

  const value = Number(env[key]);
  if (!Number.isFinite(value) || value < min || value > max) {
    errors.push(`${key} must be a number between ${min} and ${max}`);
  }
}

function assertOptionalInteger(env, key, min, max, errors) {
  if (!isPresent(env, key)) return;

  const value = Number(env[key]);
  if (!Number.isInteger(value) || value < min || value > max) {
    errors.push(`${key} must be an integer between ${min} and ${max}`);
  }
}

function assertHost(env, key, errors) {
  assertRequired(env, key, errors);
  if (!isPresent(env, key)) return;

  const value = env[key].trim();
  try {
    const parsed = new URL(`https://${value}`);
    if (parsed.hostname !== value || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('invalid host');
    }
  } catch {
    errors.push(`${key} must be a bare hostname without protocol, path, query, or hash`);
  }
}

function assertEmail(env, key, errors) {
  assertRequired(env, key, errors);
  if (!isPresent(env, key)) return;

  const value = env[key].trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    errors.push(`${key} must be a valid email address`);
  }
}

function assertGooglePair(env, errors) {
  const hasApiGoogle = isPresent(env, 'GOOGLE_CLIENT_ID') || isPresent(env, 'GOOGLE_CLIENT_IDS');
  const hasBrowserGoogle = isPresent(env, 'NEXT_PUBLIC_GOOGLE_CLIENT_ID');

  if (hasApiGoogle !== hasBrowserGoogle) {
    errors.push(
      'Google login requires both API GOOGLE_CLIENT_ID(S) and portal NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    );
  }
}

function getDeploymentTopology(env, errors) {
  const topology = isPresent(env, 'DEPLOYMENT_TOPOLOGY')
    ? env.DEPLOYMENT_TOPOLOGY.trim()
    : DEFAULT_DEPLOYMENT_TOPOLOGY;

  if (!SUPPORTED_DEPLOYMENT_TOPOLOGIES.has(topology)) {
    errors.push(
      `DEPLOYMENT_TOPOLOGY must be one of ${Array.from(SUPPORTED_DEPLOYMENT_TOPOLOGIES).join(', ')}`,
    );
  }

  return topology;
}

function assertCookieConfig(env, topology, errors) {
  if (isPresent(env, 'AUTH_COOKIE_SAME_SITE')) {
    const sameSite = env.AUTH_COOKIE_SAME_SITE.trim();
    if (!['lax', 'strict', 'none'].includes(sameSite)) {
      errors.push('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
    }
  }

  if (topology !== 'vercel-render') {
    return;
  }

  const sameSite = isPresent(env, 'AUTH_COOKIE_SAME_SITE') ? env.AUTH_COOKIE_SAME_SITE.trim() : '';

  if (sameSite !== 'lax') {
    errors.push('AUTH_COOKIE_SAME_SITE must be lax for DEPLOYMENT_TOPOLOGY=vercel-render');
  }

  if (isPresent(env, 'AUTH_COOKIE_DOMAIN')) {
    errors.push('AUTH_COOKIE_DOMAIN must be empty for DEPLOYMENT_TOPOLOGY=vercel-render');
  }
}

function assertTenantHeaderConfig(env, topology, errors) {
  const hasTenantHint = isPresent(env, 'NEXT_PUBLIC_TENANT_ID');
  const allowsTenantHeader = booleanValue(env, 'ALLOW_TENANT_HEADER_IN_PRODUCTION');

  if (hasTenantHint && !allowsTenantHeader && topology === 'vercel-render') {
    errors.push(
      'NEXT_PUBLIC_TENANT_ID requires ALLOW_TENANT_HEADER_IN_PRODUCTION=true for DEPLOYMENT_TOPOLOGY=vercel-render',
    );
  }

  if (allowsTenantHeader && !hasTenantHint) {
    errors.push(
      'ALLOW_TENANT_HEADER_IN_PRODUCTION=true requires NEXT_PUBLIC_TENANT_ID for trusted frontend deployments',
    );
  }
}

function assertDockerTopology(env, errors) {
  assertHost(env, 'API_HOST', errors);
  assertHost(env, 'STUDENT_HOST', errors);
  assertHost(env, 'ADMIN_HOST', errors);
  assertHost(env, 'PORTAL_HOST', errors);
  assertHost(env, 'COURSES_HOST', errors);
  assertEmail(env, 'CADDY_ACME_EMAIL', errors);
  assertRequired(env, 'ALERTMANAGER_WEBHOOK_URL', errors);
  assertOptionalUrl(env, 'ALERTMANAGER_WEBHOOK_URL', errors);
}

function assertVercelRenderTopology(env, errors) {
  assertRequired(env, 'APP_PUBLIC_URL', errors);

  assertHttpsOrigin(env, 'APP_PUBLIC_URL', errors);
  assertHttpsOrigin(env, 'NEXT_PUBLIC_API_URL', errors);
  assertHttpsOrigin(env, 'NEXT_PUBLIC_WEB_STUDENT_URL', errors);
  assertHttpsOrigin(env, 'NEXT_PUBLIC_WEB_SALES_URL', errors);

  assertOriginInCors(env, 'NEXT_PUBLIC_WEB_STUDENT_URL', errors);
  assertOriginInCors(env, 'NEXT_PUBLIC_WEB_SALES_URL', errors);

  if (isPresent(env, 'APP_PUBLIC_URL') && isPresent(env, 'NEXT_PUBLIC_API_URL')) {
    try {
      const appOrigin = parseExactOrigin(env.APP_PUBLIC_URL.trim());
      const apiOrigin = parseExactOrigin(env.NEXT_PUBLIC_API_URL.trim());
      if (appOrigin !== apiOrigin) {
        errors.push('APP_PUBLIC_URL and NEXT_PUBLIC_API_URL must use the same API origin');
      }
    } catch {
      // The origin shape is reported by assertOptionalOrigin.
    }
  }

  if (!booleanValue(env, 'TRUST_PROXY')) {
    errors.push('TRUST_PROXY must be true for DEPLOYMENT_TOPOLOGY=vercel-render');
  }
}

function assertNoFrontendSecrets(env, errors) {
  const forbiddenPrefixes = ['NEXT_PUBLIC_GROQ_', 'NEXT_PUBLIC_OPENAI_', 'NEXT_PUBLIC_AI_API_KEY'];
  for (const key of Object.keys(env)) {
    if (forbiddenPrefixes.some((prefix) => key.startsWith(prefix)) && isPresent(env, key)) {
      errors.push(`${key} must not be exposed to frontend runtime env`);
    }
  }
}

function assertAiProvider(env, errors) {
  if (!isPresent(env, 'AI_PROVIDER') || env.AI_PROVIDER === 'off') {
    return;
  }

  if (!['gateway', 'groq'].includes(env.AI_PROVIDER)) {
    errors.push('AI_PROVIDER must be off, gateway, or groq');
    return;
  }

  if (env.AI_PROVIDER === 'gateway') {
    assertRequired(env, 'AI_ENDPOINT_URL', errors);
  }

  if (env.AI_PROVIDER === 'groq') {
    if (!isPresent(env, 'GROQ_API_KEY') && !isPresent(env, 'AI_API_KEY')) {
      errors.push('GROQ_API_KEY or AI_API_KEY is required when AI_PROVIDER=groq');
    }
    assertOptionalUrl(env, 'GROQ_BASE_URL', errors);
  }
}

const envResult = getEnv();
const errors = [];

if (envResult.error) {
  errors.push(envResult.error);
}

const env = envResult.values;
const deploymentTopology = getDeploymentTopology(env, errors);

if (env.NODE_ENV !== 'production') {
  errors.push('NODE_ENV must be production');
}

assertRequired(env, 'DATABASE_URL', errors);
assertRequired(env, 'REDIS_URL', errors);
assertSecret(env, 'JWT_SECRET', errors);
assertSecret(env, 'JWT_RESET_SECRET', errors);
assertOrigins(env, errors);
assertRequired(env, 'NEXT_PUBLIC_API_URL', errors);
assertOptionalOrigin(env, 'NEXT_PUBLIC_API_URL', errors);
assertOptionalOrigin(env, 'APP_PUBLIC_URL', errors);
assertRequired(env, 'NEXT_PUBLIC_WEB_STUDENT_URL', errors);
assertOptionalOrigin(env, 'NEXT_PUBLIC_WEB_STUDENT_URL', errors);
assertRequired(env, 'NEXT_PUBLIC_WEB_SALES_URL', errors);
assertOptionalOrigin(env, 'NEXT_PUBLIC_WEB_SALES_URL', errors);
assertGooglePair(env, errors);
assertOptionalNumber(env, 'GOOGLE_VERIFY_TIMEOUT_MS', 1000, 30000, errors);
assertOptionalInteger(env, 'AI_MAX_RETRIES', 0, 3, errors);
assertOptionalBoolean(env, 'ALLOW_TENANT_HEADER_IN_PRODUCTION', errors);
assertOptionalBoolean(env, 'MAINTENANCE_MODE', errors);
assertOptionalBoolean(env, 'TRUST_PROXY', errors);
assertCookieConfig(env, deploymentTopology, errors);
assertTenantHeaderConfig(env, deploymentTopology, errors);
if (deploymentTopology === 'docker') {
  assertDockerTopology(env, errors);
}
if (deploymentTopology === 'vercel-render') {
  assertVercelRenderTopology(env, errors);
}
assertNoFrontendSecrets(env, errors);
assertAiProvider(env, errors);

if (errors.length > 0) {
  console.error(`production env preflight failed for ${envResult.source}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`production env preflight passed for ${envResult.source} (${deploymentTopology})`);
