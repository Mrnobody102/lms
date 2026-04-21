import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@repo/shared';

const i18nProxy = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function proxy(request: NextRequest) {
  const i18nResponse = i18nProxy(request);

  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:4000 http://localhost:3000 http://localhost:3001 http://localhost:3002;",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    i18nResponse.headers.set(key, value);
  });

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
