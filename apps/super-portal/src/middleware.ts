import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@repo/shared";

const i18nMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export default function middleware(request: NextRequest) {
  // Run i18n middleware first
  const i18nResponse = i18nMiddleware(request);

  // Add security headers to the response
  const securityHeaders = {
    "X-DNS-Prefetch-Control": "on",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy":
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self';",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    i18nResponse.headers.set(key, value);
  });

  // Check if the path requires auth
  const { pathname } = request.nextUrl;

  // Skip auth check for login, API routes, static files
  const isPublicPath =
    pathname.includes("/login") ||
    pathname.includes("/api/") ||
    pathname.includes("/_next/") ||
    pathname.includes("/favicon");

  if (isPublicPath) {
    return i18nResponse;
  }

  // Check for auth token in cookie (access_token from NestJS httpOnly cookie) or Authorization header
  const token =
    request.cookies.get("access_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    // Redirect to login preserving locale from current path
    const url = request.nextUrl.clone();
    const currentLocale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    url.pathname = `/${currentLocale}/login`;
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Validate token format (basic JWT structure check)
  const parts = token.split(".");
  if (parts.length !== 3) {
    const url = request.nextUrl.clone();
    const currentLocale = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    url.pathname = `/${currentLocale}/login`;
    return NextResponse.redirect(url);
  }

  return i18nResponse;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
