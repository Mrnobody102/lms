import { createApiClient } from '@repo/api-client';
import { DEFAULT_DEMO_TENANT_ID, defaultLocale, locales } from '@repo/shared';

function resolveTenantHint() {
  return process.env.NEXT_PUBLIC_TENANT_ID || getLocalTenantFallback();
}

function getLocalTenantFallback() {
  return DEFAULT_DEMO_TENANT_ID;
}

export default createApiClient({
  tenantId: resolveTenantHint,
  supportedLocales: locales,
  defaultLocale,
  sendTenantHeaderInProduction: true,
  onUnauthorized: () => {
    // Super portal uses an in-app login modal, not a dedicated login route.
  },
});
