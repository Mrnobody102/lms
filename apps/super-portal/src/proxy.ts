import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { buildContentSecurityPolicy, defaultLocale, locales } from '@repo/shared';

const i18nProxy = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

const supportedLocales = locales as readonly string[];

function isSupportedLocale(value: string): boolean {
  return supportedLocales.includes(value);
}

function getLocaleFromPathname(pathname: string): string {
  const segment = pathname.split('/')[1] ?? '';
  return isSupportedLocale(segment) ? segment : defaultLocale;
}

function isMaintenancePath(pathname: string): boolean {
  const segments = pathname.split('/');
  const firstSegment = segments[1] ?? '';
  const secondSegment = segments[2] ?? '';

  return (
    firstSegment === 'maintenance' ||
    (isSupportedLocale(firstSegment) && secondSegment === 'maintenance')
  );
}

export default function proxy(request: NextRequest) {
  const maintenancePathname = request.nextUrl.pathname;

  if (
    process.env.MAINTENANCE_MODE === 'true' &&
    !isMaintenancePath(maintenancePathname) &&
    !maintenancePathname.startsWith('/api') &&
    !maintenancePathname.startsWith('/_next')
  ) {
    request.nextUrl.pathname = `/${getLocaleFromPathname(maintenancePathname)}/maintenance`;
  }

  const i18nResponse = i18nProxy(request);

  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': buildContentSecurityPolicy([process.env.NEXT_PUBLIC_API_URL], {
      includeLocalhost: process.env.NODE_ENV !== 'production',
      allowUnsafeInline: true,
      allowUnsafeEval: process.env.NODE_ENV !== 'production',
    }),
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    i18nResponse.headers.set(key, value);
  });

  if (i18nResponse.status !== 200) {
    return i18nResponse;
  }

  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname.includes('/api/') || pathname.includes('/_next/') || pathname.includes('/favicon');

  if (isPublicPath) {
    return i18nResponse;
  }

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
