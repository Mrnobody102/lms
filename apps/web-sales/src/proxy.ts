import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { buildContentSecurityPolicy, defaultLocale, locales } from '@repo/shared';

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
    'Content-Security-Policy': buildContentSecurityPolicy(
      [process.env.NEXT_PUBLIC_API_URL, process.env.NEXT_PUBLIC_WEB_STUDENT_URL],
      {
        includeLocalhost: process.env.NODE_ENV !== 'production',
        allowUnsafeInline: true,
        allowUnsafeEval: process.env.NODE_ENV !== 'production',
      },
    ),
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    i18nResponse.headers.set(key, value);
  });

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
