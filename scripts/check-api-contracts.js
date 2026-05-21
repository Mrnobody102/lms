/* global console, process, require */

const fs = require('fs');
const path = require('path');

const API_SRC = path.join(process.cwd(), 'apps/api-server/src');
const ALLOWED_RAW_RESPONSE_CONTROLLERS = new Set([
  'apps/api-server/src/admin-reports/admin-reports.controller.ts',
  'apps/api-server/src/common/health/health.controller.ts',
  'apps/api-server/src/mcp/mcp.controller.ts',
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.name.endsWith('.controller.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

function normalize(filePath) {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

const errors = [];
const appModule = fs.readFileSync(path.join(API_SRC, 'app.module.ts'), 'utf8');
const interceptor = fs.readFileSync(
  path.join(API_SRC, 'common/interceptors/transform.interceptor.ts'),
  'utf8',
);

if (!appModule.includes('APP_INTERCEPTOR') || !appModule.includes('TransformInterceptor')) {
  errors.push('api-server: TransformInterceptor must be registered as a global APP_INTERCEPTOR');
}

if (!interceptor.includes('/api/health') || !interceptor.includes('/health')) {
  errors.push('api-server: TransformInterceptor must bypass health endpoints');
}

for (const file of walk(API_SRC)) {
  const relative = normalize(file);
  const source = fs.readFileSync(file, 'utf8');

  if (/return\s+\{[^}]*success\s*:/.test(source)) {
    errors.push(`${relative}: controllers must not manually return success wrappers`);
  }

  if (/@Res\(\s*\)/.test(source) && !ALLOWED_RAW_RESPONSE_CONTROLLERS.has(relative)) {
    errors.push(`${relative}: raw @Res() is only allowed for documented stream/binary endpoints`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('api contract checks passed');
