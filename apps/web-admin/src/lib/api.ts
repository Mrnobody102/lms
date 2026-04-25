import { createApiClient } from '@repo/api-client';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  onUnauthorized: () => {
    const returnUrl = window.location.pathname;
    const locale = returnUrl.match(/^\/(en|vi)\//)?.[1] || 'vi';
    window.location.href = `/${locale}/login`;
  },
});
