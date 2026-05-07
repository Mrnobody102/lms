import { createApiClient } from '@repo/api-client';
import { defaultLocale, locales } from '@repo/shared';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  supportedLocales: locales,
  defaultLocale,
  onUnauthorized: () => {
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    const locale = window.location.pathname.split('/')[1];
    const safeLocale = (locales as readonly string[]).includes(locale) ? locale : defaultLocale;
    const loginPath = `/${safeLocale}/login`;
    window.location.assign(
      window.location.pathname === loginPath
        ? loginPath
        : `${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`,
    );
  },
});
