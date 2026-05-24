import { createApiClient } from '@repo/api-client';
import { defaultLocale, locales } from '@repo/shared';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || 'trung-tam-demo',
  supportedLocales: locales,
  defaultLocale,
  sendTenantHeaderInProduction: true,
});
