import { createApiClient } from '@repo/api-client';
import { DEFAULT_DEMO_TENANT_ID, defaultLocale, locales } from '@repo/shared';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || DEFAULT_DEMO_TENANT_ID,
  supportedLocales: locales,
  defaultLocale,
  sendTenantHeaderInProduction: true,
  onUnauthorized: () => {
    const returnUrl = `${window.location.pathname}${window.location.search}`;
    const locale = window.location.pathname.split('/')[1];
    const safeLocale = (locales as readonly string[]).includes(locale) ? locale : defaultLocale;
    const loginPath = `/${safeLocale}/login`;

    const normalizedPath = window.location.pathname.replace(/\/$/, '');
    if (normalizedPath === loginPath) {
      return;
    }

    window.location.assign(`${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`);
  },
});
