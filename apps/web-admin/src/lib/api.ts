import { createApiClient } from '@repo/api-client';
import { defaultLocale, locales } from '@repo/shared';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || 'trung-tam-demo',
  supportedLocales: locales,
  defaultLocale,
  sendTenantHeaderInProduction: process.env.NODE_ENV !== 'production',
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
