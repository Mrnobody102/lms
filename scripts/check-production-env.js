/* global URL, console, process, require */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const DEFAULT_ENV_FILE = '.env.production';
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

function assertOptionalOrigin(env, key, errors) {
  if (!isPresent(env, key)) return;
  try {
    parseExactOrigin(env[key].trim());
  } catch {
    errors.push(`${key} must be an exact http(s) origin without path/query/hash`);
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

const envResult = getEnv();
const errors = [];

if (envResult.error) {
  errors.push(envResult.error);
}

const env = envResult.values;

if (env.NODE_ENV !== 'production') {
  errors.push('NODE_ENV must be production');
}

assertRequired(env, 'DATABASE_URL', errors);
assertRequired(env, 'REDIS_URL', errors);
assertSecret(env, 'JWT_SECRET', errors);
assertSecret(env, 'JWT_RESET_SECRET', errors);
assertOrigins(env, errors);
assertOptionalOrigin(env, 'NEXT_PUBLIC_API_URL', errors);
assertOptionalOrigin(env, 'APP_PUBLIC_URL', errors);
assertOptionalOrigin(env, 'NEXT_PUBLIC_WEB_STUDENT_URL', errors);
assertOptionalOrigin(env, 'NEXT_PUBLIC_WEB_SALES_URL', errors);
assertGooglePair(env, errors);

if (isPresent(env, 'AUTH_COOKIE_SAME_SITE')) {
  const sameSite = env.AUTH_COOKIE_SAME_SITE.trim();
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    errors.push('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
  }
}

if (errors.length > 0) {
  console.error(`production env preflight failed for ${envResult.source}`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`production env preflight passed for ${envResult.source}`);
