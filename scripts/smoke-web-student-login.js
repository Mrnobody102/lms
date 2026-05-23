#!/usr/bin/env node
/* eslint-disable turbo/no-undeclared-env-vars, no-undef */

const webBaseUrl = (process.env.WEB_STUDENT_URL || 'http://127.0.0.1:3100').replace(/\/+$/, '');
const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || process.env.TENANT_ID || 'trung-tam-demo';
const email = process.env.STUDENT_EMAIL || 'student@lms.com';
const password = process.env.STUDENT_PASSWORD || 'admin123';

function fail(message) {
  console.error(`web-student login smoke failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function getCookieHeader(response) {
  const cookieHeader = response.headers.get('set-cookie');
  if (!cookieHeader) {
    return '';
  }

  return cookieHeader
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

async function readJson(response, label) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    fail(`${label} did not return JSON: ${text.slice(0, 200)}`);
  }
}

async function main() {
  const loginPage = await fetch(`${webBaseUrl}/vi/login`);
  assert(loginPage.ok, `GET /vi/login returned ${loginPage.status}`);

  const loginResponse = await fetch(`${webBaseUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': tenantId,
    },
    body: JSON.stringify({ email, password }),
  });

  const loginJson = await readJson(loginResponse, 'login');
  assert(loginResponse.ok, `POST /api/auth/login returned ${loginResponse.status}`);

  const user = loginJson?.data?.user || loginJson?.user;
  assert(user?.email === email, `login returned unexpected user: ${user?.email || 'none'}`);

  const cookieHeader = getCookieHeader(loginResponse);
  assert(cookieHeader.includes('access_token='), 'login did not set access_token cookie');
  assert(cookieHeader.includes('csrf_token='), 'login did not set csrf_token cookie');

  const meResponse = await fetch(`${webBaseUrl}/api/users/me`, {
    headers: {
      cookie: cookieHeader,
      'x-tenant-id': tenantId,
    },
  });
  const meJson = await readJson(meResponse, 'users/me');
  assert(meResponse.ok, `GET /api/users/me returned ${meResponse.status}`);

  const me = meJson?.data || meJson;
  assert(me?.email === email, `users/me returned unexpected user: ${me?.email || 'none'}`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        webBaseUrl,
        tenantId,
        email,
        loginStatus: loginResponse.status,
        meStatus: meResponse.status,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
