/* global describe, expect, it, process, require */

const { execFileSync } = require('node:child_process');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

const BASE_ENV = {
  CORS_ORIGINS: 'https://student.example.com,https://courses.example.com',
  DATABASE_URL: 'postgresql://user:password@db.example.com:5432/lms',
  JWT_RESET_SECRET: 'ci-reset-secret-12345678901234567890',
  JWT_SECRET: 'ci-jwt-secret-123456789012345678901234',
  NEXT_PUBLIC_API_URL: 'https://api.example.com',
  NEXT_PUBLIC_WEB_SALES_URL: 'https://courses.example.com',
  NEXT_PUBLIC_WEB_STUDENT_URL: 'https://student.example.com',
  NODE_ENV: 'production',
  REDIS_URL: 'rediss://redis.example.com:6380',
};

function envFile(values) {
  const directory = mkdtempSync(join(tmpdir(), 'lms-prod-env-'));
  const filePath = join(directory, '.env.production');
  const source = Object.entries(values)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  writeFileSync(filePath, `${source}\n`);

  return {
    cleanup: () => rmSync(directory, { force: true, recursive: true }),
    filePath,
  };
}

function runPreflight(values) {
  const file = envFile(values);
  try {
    return execFileSync(
      process.execPath,
      ['scripts/check-production-env.js', '--file', file.filePath],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe',
      },
    );
  } finally {
    file.cleanup();
  }
}

function expectPreflightFailure(values) {
  try {
    runPreflight(values);
  } catch (error) {
    return `${error.stdout || ''}${error.stderr || ''}`;
  }
  throw new Error('Expected production env preflight to fail');
}

describe('check-production-env', () => {
  it('passes the default Docker topology with Caddy and alerting env', () => {
    const output = runPreflight({
      ...BASE_ENV,
      ADMIN_HOST: 'admin.example.com',
      ALERTMANAGER_WEBHOOK_URL: 'https://alerts.example.com/lms-platform',
      API_HOST: 'api.example.com',
      AUTH_COOKIE_DOMAIN: '.example.com',
      AUTH_COOKIE_SAME_SITE: 'lax',
      CADDY_ACME_EMAIL: 'ops@example.com',
      COURSES_HOST: 'courses.example.com',
      PORTAL_HOST: 'portal.example.com',
      STUDENT_HOST: 'student.example.com',
      TRUST_PROXY: 'true',
    });

    expect(output).toContain('(docker)');
  });

  it('passes Vercel/Render topology with trusted tenant hint configuration', () => {
    const output = runPreflight({
      ...BASE_ENV,
      ALLOW_TENANT_HEADER_IN_PRODUCTION: 'true',
      APP_PUBLIC_URL: 'https://api.example.com',
      AUTH_COOKIE_SAME_SITE: 'lax',
      DEPLOYMENT_TOPOLOGY: 'vercel-render',
      NEXT_PUBLIC_TENANT_ID: 'tenant-1',
      TRUST_PROXY: 'true',
    });

    expect(output).toContain('(vercel-render)');
  });

  it('fails Vercel/Render topology when frontend tenant hint is not trusted by API', () => {
    const output = expectPreflightFailure({
      ...BASE_ENV,
      ALLOW_TENANT_HEADER_IN_PRODUCTION: 'false',
      APP_PUBLIC_URL: 'https://api.example.com',
      AUTH_COOKIE_SAME_SITE: 'lax',
      DEPLOYMENT_TOPOLOGY: 'vercel-render',
      NEXT_PUBLIC_TENANT_ID: 'tenant-1',
      TRUST_PROXY: 'true',
    });

    expect(output).toContain('NEXT_PUBLIC_TENANT_ID requires ALLOW_TENANT_HEADER_IN_PRODUCTION');
  });

  it('fails Vercel/Render topology when cookie domain is configured', () => {
    const output = expectPreflightFailure({
      ...BASE_ENV,
      ALLOW_TENANT_HEADER_IN_PRODUCTION: 'true',
      APP_PUBLIC_URL: 'https://api.example.com',
      AUTH_COOKIE_DOMAIN: '.vercel.app',
      AUTH_COOKIE_SAME_SITE: 'lax',
      DEPLOYMENT_TOPOLOGY: 'vercel-render',
      NEXT_PUBLIC_TENANT_ID: 'tenant-1',
      TRUST_PROXY: 'true',
    });

    expect(output).toContain('AUTH_COOKIE_DOMAIN must be empty');
  });

  it('fails when optional boolean flags use non-boolean values', () => {
    const output = expectPreflightFailure({
      ...BASE_ENV,
      ADMIN_HOST: 'admin.example.com',
      ALERTMANAGER_WEBHOOK_URL: 'https://alerts.example.com/lms-platform',
      API_HOST: 'api.example.com',
      CADDY_ACME_EMAIL: 'ops@example.com',
      COURSES_HOST: 'courses.example.com',
      MAINTENANCE_MODE: 'enabled',
      PORTAL_HOST: 'portal.example.com',
      STUDENT_HOST: 'student.example.com',
      TRUST_PROXY: 'true',
    });

    expect(output).toContain('MAINTENANCE_MODE must be true or false');
  });

  it('fails when AI_MAX_RETRIES is fractional', () => {
    const output = expectPreflightFailure({
      ...BASE_ENV,
      ADMIN_HOST: 'admin.example.com',
      AI_MAX_RETRIES: '1.5',
      ALERTMANAGER_WEBHOOK_URL: 'https://alerts.example.com/lms-platform',
      API_HOST: 'api.example.com',
      CADDY_ACME_EMAIL: 'ops@example.com',
      COURSES_HOST: 'courses.example.com',
      PORTAL_HOST: 'portal.example.com',
      STUDENT_HOST: 'student.example.com',
      TRUST_PROXY: 'true',
    });

    expect(output).toContain('AI_MAX_RETRIES must be an integer between 0 and 3');
  });
});
