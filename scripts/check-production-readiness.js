/* global console, process, require */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const WEB_APPS = ['web-student', 'web-sales', 'web-admin', 'super-portal'];
const errors = [];

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function report(message) {
  errors.push(message);
}

function requireFile(relativePath) {
  if (!exists(relativePath)) {
    report(`${relativePath}: required file is missing`);
  }
}

function forbidFile(relativePath) {
  if (exists(relativePath)) {
    report(`${relativePath}: file is forbidden; use proxy.ts for Next.js portals`);
  }
}

function requireIncludes(relativePath, checks) {
  if (!exists(relativePath)) {
    report(`${relativePath}: required file is missing`);
    return;
  }

  const source = read(relativePath);
  for (const check of checks) {
    if (!source.includes(check.value)) {
      report(`${relativePath}: missing ${check.label}`);
    }
  }
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === 'dist' ||
      entry.name === 'coverage' ||
      entry.name === 'playwright-report'
    ) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(ts|tsx|js)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

for (const app of WEB_APPS) {
  const appRoot = `apps/${app}`;
  requireFile(`${appRoot}/src/proxy.ts`);
  forbidFile(`${appRoot}/middleware.ts`);
  forbidFile(`${appRoot}/src/middleware.ts`);

  requireIncludes(`${appRoot}/next.config.js`, [
    { label: 'Next standalone output', value: "output: 'standalone'" },
    { label: 'same-origin API rewrite source', value: "source: '/api/:path*'" },
    { label: 'NEXT_PUBLIC_API_URL rewrite destination', value: 'NEXT_PUBLIC_API_URL' },
  ]);

  requireIncludes(`${appRoot}/package.json`, [
    { label: 'lint script', value: '"lint"' },
    { label: 'typecheck script', value: '"typecheck"' },
    { label: 'Playwright E2E script', value: '"test:e2e"' },
  ]);

  requireIncludes(`${appRoot}/src/lib/api.ts`, [
    { label: 'shared API client usage', value: 'createApiClient' },
  ]);
}

requireIncludes('apps/api-server/src/app.module.ts', [
  { label: 'global TransformInterceptor provider', value: 'TransformInterceptor' },
  { label: 'global HttpExceptionFilter provider', value: 'HttpExceptionFilter' },
  { label: 'TenantMiddleware registration', value: 'TenantMiddleware' },
  { label: 'CsrfMiddleware registration', value: 'CsrfMiddleware' },
  { label: 'AppThrottlerGuard registration', value: 'AppThrottlerGuard' },
]);

requireIncludes('apps/api-server/src/main.ts', [
  { label: 'cookie parser middleware', value: 'cookieParser()' },
  { label: 'helmet middleware', value: 'helmet(' },
  { label: 'CORS credentials', value: 'credentials: true' },
  { label: 'exact CORS origin parsing', value: 'parseCorsOrigin' },
  { label: 'trust proxy configuration', value: "'trust proxy'" },
]);

requireIncludes('apps/api-server/src/config/env.validation.ts', [
  { label: 'production CORS requirement', value: 'CORS_ORIGINS is required in production' },
  { label: 'production Redis requirement', value: 'REDIS_URL is required in production' },
  {
    label: 'production reset secret requirement',
    value: 'JWT_RESET_SECRET is required in production',
  },
  { label: 'tenant header production flag', value: 'ALLOW_TENANT_HEADER_IN_PRODUCTION' },
  { label: 'auth cookie same-site config', value: 'AUTH_COOKIE_SAME_SITE' },
]);

requireIncludes('apps/api-server/src/auth/auth.service.ts', [
  { label: 'HttpOnly auth cookies', value: 'httpOnly: true' },
  { label: 'secure production cookies', value: "process.env.NODE_ENV === 'production'" },
  { label: 'auth cookie domain config', value: 'AUTH_COOKIE_DOMAIN' },
  { label: 'refresh token cookie', value: "'refresh_token'" },
]);

requireIncludes('apps/api-server/src/common/middleware/csrf.middleware.ts', [
  { label: 'CSRF cookie/header validation', value: 'CSRF_HEADER_NAME' },
  { label: 'safe method bypass', value: 'SAFE_METHODS' },
  { label: 'auth route CSRF exemptions', value: 'CSRF_EXEMPT_PATHS' },
]);

requireIncludes('packages/api-client/src/index.ts', [
  { label: 'browser same-origin API base URL', value: "return '/api'" },
  { label: 'credentialed browser requests', value: 'withCredentials: true' },
  { label: 'refresh-token retry flow', value: "api.post('/auth/refresh'" },
  { label: 'legacy token cleanup', value: 'LEGACY_AUTH_STORAGE_KEYS.token' },
]);

requireIncludes('packages/shared/src/security/csp.ts', [
  { label: 'Google Identity Services script source', value: 'https://accounts.google.com' },
  { label: 'style-src directive', value: 'style-src' },
  { label: 'connect-src directive', value: 'connect-src' },
]);

requireIncludes('package.json', [
  { label: 'tenant scope audit script', value: '"check:tenant-scope"' },
  { label: 'production env preflight script', value: '"check:production-env"' },
  { label: 'read-only data integrity script', value: '"check:data-integrity"' },
  { label: 'cross-platform port cleanup script', value: 'node scripts/stop-project-processes.js' },
]);

requireFile('scripts/stop-project-processes.js');
requireFile('scripts/check-data-integrity.js');

requireIncludes('apps/api-server/src/course/dto/course-query.dto.ts', [
  { label: 'course list limit cap', value: '@Max(100)' },
]);

requireIncludes('apps/api-server/src/practice/dto/practice-query.dto.ts', [
  { label: 'practice list limit cap', value: '@Max(100)' },
]);

requireIncludes('apps/api-server/src/practice/dto/practice-attempt-query.dto.ts', [
  { label: 'practice attempt list limit cap', value: '@Max(20)' },
]);

requireIncludes('apps/api-server/src/practice/practice.service.ts', [
  { label: 'practice service-level attempt limit cap', value: 'private getAttemptLimit' },
  {
    label: 'practice recommendation limit cap',
    value: 'Math.min(Math.max(query.limit ?? 12, 1), 24)',
  },
]);

requireIncludes('apps/api-server/src/exam/dto/exam-query.dto.ts', [
  { label: 'exam list limit cap', value: '@Max(100)' },
]);

requireIncludes('apps/api-server/src/exam/dto/exam-attempt-query.dto.ts', [
  { label: 'exam attempt list limit cap', value: '@Max(20)' },
]);

requireIncludes('apps/api-server/src/exam/exam.service.ts', [
  { label: 'exam list limit cap', value: 'Math.min(Math.max(query.limit ?? 20, 1), 100)' },
  { label: 'exam service-level attempt limit cap', value: 'private getAttemptLimit' },
]);

requireIncludes('apps/api-server/src/notification/dto/notification-query.dto.ts', [
  { label: 'notification list limit cap', value: '@Max(50)' },
]);

requireIncludes('apps/api-server/src/notification/notification.service.ts', [
  {
    label: 'notification service-level take cap',
    value: 'const boundedTake = Math.min(Math.max(take, 1), 50)',
  },
]);

requireIncludes('apps/api-server/src/admin-reports/dto/risk-report-query.dto.ts', [
  { label: 'risk report limit cap', value: '@Max(100)' },
]);

requireIncludes('apps/api-server/src/admin/admin-platform.service.ts', [
  { label: 'platform audit log cap', value: 'take: 100' },
  { label: 'platform billing global cap', value: 'take: tenantId ? 20 : 100' },
]);

const tokenStoragePattern =
  /localStorage\.(setItem|getItem)\(\s*['"`](token|access_token|refresh_token)['"`]/;
for (const file of [...walk(path.join(ROOT, 'apps')), ...walk(path.join(ROOT, 'packages'))]) {
  const relative = path.relative(ROOT, file).split(path.sep).join('/');
  if (relative.endsWith('.spec.ts') || relative.endsWith('.test.ts')) continue;
  const source = fs.readFileSync(file, 'utf8');
  if (tokenStoragePattern.test(source)) {
    report(`${relative}: browser auth tokens must not be read from or written to localStorage`);
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('production readiness checks passed');
