import { describe, expect, it } from 'vitest';
import { buildContentSecurityPolicy } from './csp';

describe('buildContentSecurityPolicy', () => {
  it('does not allow unsafe inline scripts by default', () => {
    const policy = buildContentSecurityPolicy(['https://api.example.com']);

    expect(policy).toContain("script-src 'self'");
    expect(policy).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(policy).toContain('connect-src');
    expect(policy).toContain('https://api.example.com');
  });

  it('allows unsafe inline scripts only when explicitly requested', () => {
    const policy = buildContentSecurityPolicy([], { allowUnsafeInline: true });

    expect(policy).toContain("script-src 'self' 'unsafe-inline'");
  });
});
