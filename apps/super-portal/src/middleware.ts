import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@repo/shared';

const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export default function middleware(request: NextRequest) {
  // Run i18n middleware first (handles locale redirects: / -> /vi)
  const i18nResponse = i18nMiddleware(request);

  // Add security headers to the response
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

  // If i18n redirected (status != 200), pass it through
  if (i18nResponse.status !== 200) {
    return i18nResponse;
  }

  // Get resolved pathname
  const { pathname } = request.nextUrl;

  // Skip for API routes, static files
  const isPublicPath =
    pathname.includes('/api/') || pathname.includes('/_next/') || pathname.includes('/favicon');

  if (isPublicPath) {
    return i18nResponse;
  }

  // Check auth token
  const token =
    request.cookies.get('access_token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '');

  // No token → show home page with LoginModal (i18n response already has /vi prefix)
  if (!token) {
    return i18nResponse;
  }

  // Validate JWT structure
  const parts = token.split('.');
  if (parts.length !== 3) {
    // Invalid token → clear cookie and show home page
    const response = NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
    response.cookies.delete('access_token');
    return response;
  }

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
