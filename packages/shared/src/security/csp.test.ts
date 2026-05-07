import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from './csp';

describe('buildContentSecurityPolicy', () => {
  it('does not allow unsafe inline scripts by default', () => {
    const policy = buildContentSecurityPolicy(['https://api.example.com']);

    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("frame-ancestors 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain('connect-src');
    expect(policy).toContain('https://api.example.com');
  });

  it('allows unsafe inline scripts only when explicitly requested', () => {
    const policy = buildContentSecurityPolicy([], { allowUnsafeInline: true });

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
  });

  it('allows local websocket and loopback connect sources in non-production dev mode', () => {
    const policy = buildContentSecurityPolicy([], { includeLocalhost: true });

    expect(policy).toContain('ws://localhost:3000');
    expect(policy).toContain('http://127.0.0.1:4000');
  });
});
