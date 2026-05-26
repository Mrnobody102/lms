/* global console, process, require */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SCHEMA_PATH = 'packages/database/prisma/schema.prisma';
const API_SRC = 'apps/api-server/src';
const ALLOWLIST_PATH = 'scripts/tenant-scope-allowlist.json';
const STRICT = process.argv.includes('--strict') || process.env.TENANT_SCOPE_AUDIT_STRICT === '1';

const WRITE_OPERATIONS = new Set([
  'create',
  'createMany',
  'delete',
  'deleteMany',
  'update',
  'updateMany',
  'upsert',
]);

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === 'dist' ||
      entry.name === 'coverage' ||
      entry.name === '.next'
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.spec.ts') &&
      !entry.name.endsWith('.test.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function toDelegateName(modelName) {
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

function getTenantScopedDelegates() {
  const schema = read(SCHEMA_PATH);
  const delegates = new Set();
  const modelPattern = /model\s+(\w+)\s+\{([\s\S]*?)\n\}/g;
  let match;

  while ((match = modelPattern.exec(schema)) !== null) {
    const modelName = match[1];
    const body = match[2];
    if (/^\s*tenantId\s+String\b/m.test(body)) {
      delegates.add(toDelegateName(modelName));
    }
  }

  return delegates;
}

function getAllowlist() {
  const fullPath = path.join(ROOT, ALLOWLIST_PATH);
  if (!fs.existsSync(fullPath)) return [];
  const entries = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  if (!Array.isArray(entries)) {
    throw new Error(`${ALLOWLIST_PATH} must contain an array`);
  }
  return entries;
}

function extractCall(source, openParenIndex) {
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = openParenIndex; index < source.length; index += 1) {
    const char = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      continue;
    }

    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (depth === 0) {
      return source.slice(openParenIndex, index + 1);
    }
  }

  return source.slice(openParenIndex);
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function hasTenantScope(callText, nearbyContext) {
  return /\btenantId\b/.test(callText) || /\btenantId\b/.test(nearbyContext);
}

function isAllowlisted(finding, allowlist) {
  return allowlist.some((entry) => {
    return (
      entry.file === finding.file &&
      entry.delegate === finding.delegate &&
      entry.operation === finding.operation &&
      typeof entry.reason === 'string' &&
      entry.reason.trim().length > 0
    );
  });
}

const tenantScopedDelegates = getTenantScopedDelegates();
const allowlist = getAllowlist();
const rawFindings = [];
const callPattern =
  /this\.prisma\.(\w+)\.(findMany|findFirst|findUnique|findFirstOrThrow|findUniqueOrThrow|create|createMany|update|updateMany|upsert|delete|deleteMany|count|aggregate|groupBy)\s*\(/g;

for (const file of walk(path.join(ROOT, API_SRC))) {
  const source = fs.readFileSync(file, 'utf8');
  let match;

  while ((match = callPattern.exec(source)) !== null) {
    const delegate = match[1];
    const operation = match[2];
    if (!tenantScopedDelegates.has(delegate)) continue;

    const openParenIndex = match.index + match[0].lastIndexOf('(');
    const callText = extractCall(source, openParenIndex);
    const nearbyContext = source.slice(Math.max(0, match.index - 1200), match.index);

    if (hasTenantScope(callText, nearbyContext)) continue;

    rawFindings.push({
      file: path.relative(ROOT, file).split(path.sep).join('/'),
      line: lineNumber(source, match.index),
      delegate,
      operation,
      write: WRITE_OPERATIONS.has(operation),
    });
  }
}

const findings = rawFindings.filter((finding) => !isAllowlisted(finding, allowlist));
const allowlistedCount = rawFindings.length - findings.length;

if (findings.length === 0) {
  const suffix = allowlistedCount > 0 ? ` (${allowlistedCount} allowlisted global call(s))` : '';
  console.log(`tenant scope audit passed${suffix}`);
  process.exit(0);
}

const writeFindings = findings.filter((finding) => finding.write);
console.warn(
  `tenant scope audit found ${findings.length} Prisma call(s) needing review ` +
    `(${writeFindings.length} write call(s)); mode=${STRICT ? 'strict' : 'advisory'}`,
);

for (const finding of findings) {
  const severity = finding.write ? 'write' : 'read';
  console.warn(
    `${finding.file}:${finding.line} ${severity} ${finding.delegate}.${finding.operation} lacks nearby tenantId`,
  );
}

if (STRICT) {
  process.exit(1);
}
