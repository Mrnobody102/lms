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
  options: { includeLocalhost?: boolean } = {},
) {
  const allowedConnectSources = new Set(["'self'"]);

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
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(allowedConnectSources).join(' ')}`,
  ].join('; ');
}
