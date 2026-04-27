import { createApiClient } from '@repo/api-client';
import { defaultLocale, locales } from '@repo/shared';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  supportedLocales: locales,
  defaultLocale,
});
