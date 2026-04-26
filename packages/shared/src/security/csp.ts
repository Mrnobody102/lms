function getOrigin(value: string | undefined): string | null {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function buildContentSecurityPolicy(
  connectSources: Array<string | undefined> = [],
  options: { includeLocalhost?: boolean; allowUnsafeEval?: boolean } = {},
) {
  const allowedConnectSources = new Set(["'self'"]);
  const scriptSources = ["'self'", "'unsafe-inline'"];

  if (options.allowUnsafeEval) {
    scriptSources.push("'unsafe-eval'");
  }

  if (options.includeLocalhost) {
    [
      'http://localhost:4000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ].forEach((source) => allowedConnectSources.add(source));
  }

  connectSources.map(getOrigin).forEach((origin) => {
    if (origin) allowedConnectSources.add(origin);
  });

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(allowedConnectSources).join(' ')}`,
  ].join('; ');
}
