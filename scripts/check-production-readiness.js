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
    { label: 'shared API rewrite destination helper', value: 'getApiRewriteDestination' },
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
  { label: 'load baseline script', value: '"load:baseline"' },
  { label: 'production auth smoke script', value: '"smoke:auth-production"' },
  { label: 'scripts lint gate', value: '"lint:scripts"' },
  { label: 'scripts test gate', value: '"test:scripts"' },
  { label: 'production release gate script', value: '"release:production-check"' },
  { label: 'cross-platform port cleanup script', value: 'node scripts/stop-project-processes.js' },
]);

requireFile('scripts/stop-project-processes.js');
requireFile('scripts/check-data-integrity.js');
requireFile('scripts/load-baseline.js');
requireIncludes('scripts/next-api-rewrite.js', [
  { label: 'production API URL rewrite requirement', value: 'NEXT_PUBLIC_API_URL' },
  { label: 'accidental /api suffix normalization', value: "replace(/\\/api$/i, '')" },
]);
requireFile('scripts/smoke-auth-production.js');

requireIncludes('deployment/production/Caddyfile', [
  { label: 'API host route', value: '{$API_HOST}' },
  { label: 'student host route', value: '{$STUDENT_HOST}' },
  { label: 'admin host route', value: '{$ADMIN_HOST}' },
  { label: 'portal host route', value: '{$PORTAL_HOST}' },
  { label: 'courses host route', value: '{$COURSES_HOST}' },
  { label: 'tenant header stripping', value: 'header_up -x-tenant-id' },
  { label: 'upload body limit', value: 'request_body' },
]);

requireIncludes('deployment/production/docker-compose.prod.yml', [
  { label: 'Caddy edge service', value: 'caddy:' },
  { label: 'Caddy public HTTP port', value: "'80:80'" },
  { label: 'Caddy public HTTPS port', value: "'443:443'" },
  { label: 'API internal expose', value: "      - '4000'" },
  { label: 'default trusted proxy through edge', value: 'TRUST_PROXY: ${TRUST_PROXY:-true}' },
  { label: 'Prometheus service', value: 'prometheus:' },
  { label: 'Alertmanager service', value: 'alertmanager:' },
  { label: 'Alertmanager webhook env', value: 'ALERTMANAGER_WEBHOOK_URL' },
]);

requireIncludes('deployment/production/monitoring/alertmanager.yml', [
  { label: 'generic webhook receiver URL file', value: 'url_file: /tmp/alertmanager-webhook-url' },
  { label: 'resolved alert forwarding', value: 'send_resolved: true' },
]);

requireIncludes('.github/workflows/docker-build.yml', [
  {
    label: 'production env preflight in docker workflow',
    value: 'node scripts/check-production-env.js',
  },
  { label: 'JWT reset secret parity', value: 'JWT_RESET_SECRET' },
  { label: 'web sales URL parity', value: 'NEXT_PUBLIC_WEB_SALES_URL' },
  { label: 'web-sales image build', value: 'build web-sales' },
]);

requireIncludes('.env.production.example', [
  { label: 'deployment topology env', value: 'DEPLOYMENT_TOPOLOGY=' },
  { label: 'API host env', value: 'API_HOST=' },
  { label: 'student host env', value: 'STUDENT_HOST=' },
  { label: 'admin host env', value: 'ADMIN_HOST=' },
  { label: 'portal host env', value: 'PORTAL_HOST=' },
  { label: 'courses host env', value: 'COURSES_HOST=' },
  { label: 'Caddy ACME email env', value: 'CADDY_ACME_EMAIL=' },
  { label: 'Alertmanager webhook env', value: 'ALERTMANAGER_WEBHOOK_URL=' },
]);
requireFile('docs/runbooks/backup-restore-runbook.md');
requireFile('docs/ops/data-retention.md');
requireFile('docs/ops/performance-load.md');
requireFile('docs/ops/security-compliance.md');

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
  { label: 'platform service-level list cap', value: 'const MAX_PLATFORM_LIMIT = 100' },
  { label: 'platform shared pagination helper', value: 'function getPagination' },
  { label: 'platform paginated queries use bounded limit', value: 'take: limit' },
]);

requireIncludes('apps/api-server/src/admin/dto/platform-query.dto.ts', [
  { label: 'platform list DTO limit cap', value: '@Max(100)' },
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
