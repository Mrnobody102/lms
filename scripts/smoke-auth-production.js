#!/usr/bin/env node
/* global AbortController, URL, clearTimeout, console, fetch, module, process, require, setTimeout */

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_LOCALE = 'vi';

function envValue(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

function fail(message) {
  console.error(`production auth smoke failed: ${message}`);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function normalizeOrigin(value, label) {
  if (!value) {
    return '';
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a valid http(s) URL`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    fail(`${label} must use http or https`);
  }

  return parsed.origin;
}

function normalizeApiOrigin(value) {
  if (!value) {
    return '';
  }

  const parsed = new URL(value);
  if (parsed.pathname.replace(/\/+$/, '') === '/api') {
    parsed.pathname = '/';
  }
  parsed.search = '';
  parsed.hash = '';
  return normalizeOrigin(parsed.toString(), 'AUTH_SMOKE_API_URL');
}

function boundedTimeoutMs(value) {
  if (!value) {
    return DEFAULT_TIMEOUT_MS;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 60000) {
    fail('AUTH_SMOKE_TIMEOUT_MS must be a number between 1000 and 60000');
  }
  return parsed;
}

function selectedMode(value, hasApiUrl) {
  const mode = (value || (hasApiUrl ? 'both' : 'proxy')).trim().toLowerCase();
  if (!['proxy', 'direct', 'both'].includes(mode)) {
    fail('AUTH_SMOKE_MODE must be proxy, direct, or both');
  }
  return mode;
}

function requestHeaders(options = {}) {
  const headers = {
    'content-type': 'application/json',
    ...options.extraHeaders,
  };

  if (options.tenantId) {
    headers['x-tenant-id'] = options.tenantId;
  }

  if (options.cookieHeader) {
    headers.cookie = options.cookieHeader;
  }

  if (options.csrfToken) {
    headers['x-csrf-token'] = options.csrfToken;
  }

  if (options.origin) {
    headers.origin = options.origin;
  }

  return headers;
}

function createUrl(baseUrl, path) {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

async function fetchWithTimeout(url, init, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      fail(`${init?.method || 'GET'} ${url} timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(response, label) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    fail(`${label} did not return JSON: ${text.slice(0, 200)}`);
  }
}

function getSetCookieValues(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  const cookieHeader = headers.get('set-cookie');
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(/,(?=\s*[^;,]+=)/)
    .map((cookie) => cookie.trim())
    .filter(Boolean);
}

function getCookieName(setCookieValue) {
  return setCookieValue.split('=')[0].trim();
}

function getCookieValue(setCookieValue) {
  const firstSegment = setCookieValue.split(';')[0];
  const equalsIndex = firstSegment.indexOf('=');
  return equalsIndex === -1 ? '' : firstSegment.slice(equalsIndex + 1);
}

function buildCookieHeader(setCookieValues) {
  return setCookieValues
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

function cookieByName(setCookieValues, name) {
  return setCookieValues.find((cookie) => getCookieName(cookie) === name) || '';
}

function hasCookieAttribute(setCookieValue, attribute) {
  return setCookieValue
    .split(';')
    .slice(1)
    .some((part) => part.trim().toLowerCase() === attribute.toLowerCase());
}

function hasCookieAttributePrefix(setCookieValue, attributePrefix) {
  return setCookieValue
    .split(';')
    .slice(1)
    .some((part) => part.trim().toLowerCase().startsWith(attributePrefix.toLowerCase()));
}

function requireCookieFlags(setCookieValues, cookieName, shouldRequireSecure) {
  const cookie = cookieByName(setCookieValues, cookieName);
  assert(cookie, `login did not set ${cookieName} cookie`);

  if (cookieName !== 'csrf_token') {
    assert(hasCookieAttribute(cookie, 'HttpOnly'), `${cookieName} cookie is missing HttpOnly`);
  }

  assert(hasCookieAttributePrefix(cookie, 'SameSite='), `${cookieName} cookie is missing SameSite`);

  if (shouldRequireSecure) {
    assert(hasCookieAttribute(cookie, 'Secure'), `${cookieName} cookie is missing Secure`);
  }
}

function unwrapUser(payload) {
  return payload?.data?.user || payload?.user || payload?.data || payload;
}

function assertWrappedSuccess(payload, label) {
  if (Object.prototype.hasOwnProperty.call(payload, 'success')) {
    assert(payload.success === true, `${label} returned success=false`);
    assert(payload.timestamp, `${label} wrapped response is missing timestamp`);
  }
}

async function assertLoginPage(webBaseUrl, locale, timeoutMs) {
  const response = await fetchWithTimeout(createUrl(webBaseUrl, `/${locale}/login`), {}, timeoutMs);
  assert(response.ok, `GET /${locale}/login returned ${response.status}`);
  return response.status;
}

async function loginVia(baseUrl, options) {
  const loginResponse = await fetchWithTimeout(
    createUrl(baseUrl, '/api/auth/login'),
    {
      method: 'POST',
      headers: requestHeaders({
        tenantId: options.tenantId,
        origin: options.origin,
      }),
      body: JSON.stringify({
        email: options.email,
        password: options.password,
      }),
    },
    options.timeoutMs,
  );

  const loginJson = await readJson(loginResponse, `${options.label} login`);
  assert(
    loginResponse.ok,
    `${options.label} POST /api/auth/login returned ${loginResponse.status}`,
  );
  assertWrappedSuccess(loginJson, `${options.label} login`);

  const user = unwrapUser(loginJson);
  assert(user?.email === options.expectedEmail, `${options.label} login returned unexpected user`);

  const setCookieValues = getSetCookieValues(loginResponse.headers);
  const shouldRequireSecure = options.requireSecureCookies;
  requireCookieFlags(setCookieValues, 'access_token', shouldRequireSecure);
  requireCookieFlags(setCookieValues, 'refresh_token', shouldRequireSecure);
  requireCookieFlags(setCookieValues, 'csrf_token', shouldRequireSecure);

  return {
    cookieHeader: buildCookieHeader(setCookieValues),
    csrfToken: getCookieValue(cookieByName(setCookieValues, 'csrf_token')),
    status: loginResponse.status,
  };
}

async function assertCurrentUser(baseUrl, loginState, options) {
  const response = await fetchWithTimeout(
    createUrl(baseUrl, '/api/users/me'),
    {
      headers: requestHeaders({
        cookieHeader: loginState.cookieHeader,
        tenantId: options.tenantId,
        origin: options.origin,
      }),
    },
    options.timeoutMs,
  );
  const json = await readJson(response, `${options.label} users/me`);

  assert(response.ok, `${options.label} GET /api/users/me returned ${response.status}`);
  assertWrappedSuccess(json, `${options.label} users/me`);

  const user = unwrapUser(json);
  assert(
    user?.email === options.expectedEmail,
    `${options.label} users/me returned unexpected user`,
  );
  return response.status;
}

async function assertLogout(baseUrl, loginState, options) {
  const response = await fetchWithTimeout(
    createUrl(baseUrl, '/api/auth/logout'),
    {
      method: 'POST',
      headers: requestHeaders({
        cookieHeader: loginState.cookieHeader,
        csrfToken: loginState.csrfToken,
        tenantId: options.tenantId,
        origin: options.origin,
      }),
    },
    options.timeoutMs,
  );

  const json = await readJson(response, `${options.label} logout`);
  assert(response.ok, `${options.label} POST /api/auth/logout returned ${response.status}`);
  assertWrappedSuccess(json, `${options.label} logout`);
  return response.status;
}

async function runProxySmoke(config) {
  assert(config.webBaseUrl, 'AUTH_SMOKE_WEB_URL or WEB_STUDENT_URL is required for proxy mode');

  const loginPageStatus = await assertLoginPage(config.webBaseUrl, config.locale, config.timeoutMs);
  const loginState = await loginVia(config.webBaseUrl, {
    ...config,
    label: 'proxy',
    origin: '',
    requireSecureCookies: config.requireSecureCookies,
  });
  const meStatus = await assertCurrentUser(config.webBaseUrl, loginState, {
    ...config,
    label: 'proxy',
    origin: '',
  });
  const logoutStatus = await assertLogout(config.webBaseUrl, loginState, {
    ...config,
    label: 'proxy',
    origin: '',
  });

  return {
    loginPageStatus,
    loginStatus: loginState.status,
    logoutStatus,
    meStatus,
  };
}

async function runCorsPreflight(config) {
  assert(config.webBaseUrl, 'AUTH_SMOKE_WEB_URL or WEB_STUDENT_URL is required for direct mode');

  const response = await fetchWithTimeout(
    createUrl(config.apiBaseUrl, '/api/auth/login'),
    {
      method: 'OPTIONS',
      headers: {
        origin: config.webBaseUrl,
        'access-control-request-method': 'POST',
        'access-control-request-headers': config.tenantId
          ? 'content-type,x-tenant-id'
          : 'content-type',
      },
    },
    config.timeoutMs,
  );

  assert(
    response.status === 204 || response.status === 200,
    `direct OPTIONS /api/auth/login returned ${response.status}`,
  );

  const allowOrigin = response.headers.get('access-control-allow-origin') || '';
  const allowCredentials = response.headers.get('access-control-allow-credentials') || '';
  const allowHeaders = response.headers.get('access-control-allow-headers') || '';

  assert(
    allowOrigin === config.webBaseUrl,
    `CORS allow-origin mismatch: expected ${config.webBaseUrl}, got ${allowOrigin || 'empty'}`,
  );
  assert(allowCredentials === 'true', 'CORS allow-credentials must be true');
  if (config.tenantId) {
    assert(/x-tenant-id/i.test(allowHeaders), 'CORS allow-headers is missing x-tenant-id');
  }

  return response.status;
}

async function runDirectSmoke(config) {
  assert(config.apiBaseUrl, 'AUTH_SMOKE_API_URL, API_URL, or NEXT_PUBLIC_API_URL is required');

  const corsStatus = await runCorsPreflight(config);
  const loginState = await loginVia(config.apiBaseUrl, {
    ...config,
    label: 'direct',
    origin: config.webBaseUrl,
    requireSecureCookies: config.apiBaseUrl.startsWith('https://'),
  });
  const meStatus = await assertCurrentUser(config.apiBaseUrl, loginState, {
    ...config,
    label: 'direct',
    origin: config.webBaseUrl,
  });
  const logoutStatus = await assertLogout(config.apiBaseUrl, loginState, {
    ...config,
    label: 'direct',
    origin: config.webBaseUrl,
  });

  return {
    corsStatus,
    loginStatus: loginState.status,
    logoutStatus,
    meStatus,
  };
}

async function main() {
  const webBaseUrl = normalizeOrigin(
    envValue('AUTH_SMOKE_WEB_URL', 'WEB_STUDENT_URL'),
    'AUTH_SMOKE_WEB_URL',
  );
  const apiBaseUrl = normalizeApiOrigin(
    envValue('AUTH_SMOKE_API_URL', 'API_URL', 'NEXT_PUBLIC_API_URL'),
  );
  const email = envValue('AUTH_SMOKE_EMAIL', 'STUDENT_EMAIL');
  const password = envValue('AUTH_SMOKE_PASSWORD', 'STUDENT_PASSWORD');
  const tenantId = envValue('AUTH_SMOKE_TENANT_ID', 'NEXT_PUBLIC_TENANT_ID', 'TENANT_ID');
  const expectedEmail = envValue('AUTH_SMOKE_EXPECT_EMAIL') || email;
  const timeoutMs = boundedTimeoutMs(envValue('AUTH_SMOKE_TIMEOUT_MS'));
  const locale = envValue('AUTH_SMOKE_LOCALE') || DEFAULT_LOCALE;
  const mode = selectedMode(envValue('AUTH_SMOKE_MODE'), Boolean(apiBaseUrl));
  const requireSecureCookies = webBaseUrl.startsWith('https://');

  assert(email, 'AUTH_SMOKE_EMAIL or STUDENT_EMAIL is required');
  assert(password, 'AUTH_SMOKE_PASSWORD or STUDENT_PASSWORD is required');

  if ((mode === 'proxy' || mode === 'both') && !webBaseUrl) {
    fail('AUTH_SMOKE_WEB_URL or WEB_STUDENT_URL is required for proxy mode');
  }
  if ((mode === 'direct' || mode === 'both') && !apiBaseUrl) {
    fail('AUTH_SMOKE_API_URL, API_URL, or NEXT_PUBLIC_API_URL is required for direct mode');
  }

  const summary = {
    ok: true,
    apiBaseUrl: apiBaseUrl || null,
    email,
    mode,
    tenantId: tenantId || null,
    webBaseUrl: webBaseUrl || null,
  };

  if (mode === 'proxy' || mode === 'both') {
    summary.proxy = await runProxySmoke({
      email,
      expectedEmail,
      locale,
      requireSecureCookies,
      tenantId,
      timeoutMs,
      webBaseUrl,
    });
  }

  if (mode === 'direct' || mode === 'both') {
    summary.direct = await runDirectSmoke({
      apiBaseUrl,
      email,
      expectedEmail,
      locale,
      requireSecureCookies,
      tenantId,
      timeoutMs,
      webBaseUrl,
    });
  }

  console.log(JSON.stringify(summary, null, 2));
}

module.exports = {
  boundedTimeoutMs,
  buildCookieHeader,
  cookieByName,
  getCookieValue,
  getSetCookieValues,
  normalizeApiOrigin,
  normalizeOrigin,
  selectedMode,
};

if (require.main === module) {
  main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
}
