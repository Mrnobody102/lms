import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@repo/shared';

export default createMiddleware({
  locales: locales as unknown as string[],
  defaultLocale,
  localePrefix: 'always',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
