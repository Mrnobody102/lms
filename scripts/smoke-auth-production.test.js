/* global describe, expect, it, require */

const {
  boundedTimeoutMs,
  buildCookieHeader,
  getCookieValue,
  getSetCookieValues,
  normalizeApiOrigin,
  normalizeOrigin,
  selectedMode,
} = require('./smoke-auth-production');

describe('smoke-auth-production helpers', () => {
  it('normalizes frontend and API origins', () => {
    expect(normalizeOrigin('https://student.example.com/vi/login', 'web')).toBe(
      'https://student.example.com',
    );
    expect(normalizeApiOrigin('https://api.example.com/api')).toBe('https://api.example.com');
    expect(normalizeApiOrigin('https://api.example.com/api/')).toBe('https://api.example.com');
  });

  it('selects a practical default mode from available URLs', () => {
    expect(selectedMode('', true)).toBe('both');
    expect(selectedMode('', false)).toBe('proxy');
    expect(selectedMode('direct', false)).toBe('direct');
  });

  it('bounds request timeout configuration', () => {
    expect(boundedTimeoutMs('')).toBe(15000);
    expect(boundedTimeoutMs('30000')).toBe(30000);
  });

  it('extracts set-cookie values and builds a request cookie header', () => {
    const headers = {
      get(name) {
        if (name !== 'set-cookie') return '';
        return [
          'access_token=access; Path=/; HttpOnly; Secure; SameSite=Lax',
          'refresh_token=refresh; Path=/; HttpOnly; Secure; SameSite=Lax',
          'csrf_token=csrf; Path=/; Secure; SameSite=Lax',
        ].join(', ');
      },
    };

    const setCookieValues = getSetCookieValues(headers);

    expect(setCookieValues).toHaveLength(3);
    expect(buildCookieHeader(setCookieValues)).toBe(
      'access_token=access; refresh_token=refresh; csrf_token=csrf',
    );
    expect(getCookieValue(setCookieValues[2])).toBe('csrf');
  });
});
