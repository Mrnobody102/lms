import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@repo/shared";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always",
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they contain a dot (e.g. `favicon.ico`)
    // - /api, /_next, /_vercel
    "/((?!api|_next|_vercel|.*\\..*).*)",
    // However, some versions of Next.js might still pass favicon.ico if it's in the root
    // Let's add an explicit negative lookahead for favicon.ico if needed,
    // but the above usually works if used with a leading slash.
  ],
};
