import { createApiClient } from '@repo/api-client';

export default createApiClient({
  baseURL: '/api',
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  supportedLocales: ['vi', 'en'],
  defaultLocale: 'vi',
});
