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
  options: {
    includeLocalhost?: boolean;
    allowUnsafeEval?: boolean;
    allowUnsafeInline?: boolean;
  } = {},
) {
  const allowedConnectSources = new Set(["'self'", 'https://accounts.google.com']);
  const frameSources = [
    "'self'",
    'https://accounts.google.com',
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
  ];
  const scriptSources = ["'self'", 'https://accounts.google.com'];
  const styleSources = ["'self'", "'unsafe-inline'", 'https://accounts.google.com'];

  if (options.allowUnsafeInline) {
    scriptSources.push("'unsafe-inline'");
  }

  if (options.allowUnsafeEval) {
    scriptSources.push("'unsafe-eval'");
  }

  if (options.includeLocalhost) {
    [
      'http://localhost:4000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3100',
      'http://localhost:3101',
      'http://localhost:3102',
      'http://localhost:3103',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3100',
      'http://127.0.0.1:3101',
      'http://127.0.0.1:3102',
      'http://127.0.0.1:3103',
      'ws://localhost:4000',
      'ws://localhost:3000',
      'ws://localhost:3001',
      'ws://localhost:3002',
      'ws://localhost:3100',
      'ws://localhost:3101',
      'ws://localhost:3102',
      'ws://localhost:3103',
      'ws://127.0.0.1:4000',
      'ws://127.0.0.1:3000',
      'ws://127.0.0.1:3001',
      'ws://127.0.0.1:3002',
      'ws://127.0.0.1:3100',
      'ws://127.0.0.1:3101',
      'ws://127.0.0.1:3102',
      'ws://127.0.0.1:3103',
    ].forEach((source) => allowedConnectSources.add(source));
  }

  connectSources.map(getOrigin).forEach((origin) => {
    if (origin) allowedConnectSources.add(origin);
  });

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    `frame-src ${frameSources.join(' ')}`,
    "form-action 'self'",
    `script-src ${scriptSources.join(' ')}`,
    `style-src ${styleSources.join(' ')}`,
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    `connect-src ${Array.from(allowedConnectSources).join(' ')}`,
  ].join('; ');
}
