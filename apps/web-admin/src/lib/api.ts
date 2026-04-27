import { createApiClient } from '@repo/api-client';
import { defaultLocale, locales } from '@repo/shared';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  supportedLocales: locales,
  defaultLocale,
  onUnauthorized: () => {
    const returnUrl = window.location.pathname;
    const locale = returnUrl.split('/')[1];
    const safeLocale = (locales as readonly string[]).includes(locale) ? locale : defaultLocale;
    window.location.assign(`/${safeLocale}/login`);
  },
});
