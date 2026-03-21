import { createApiClient } from '@repo/api-client';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID || 'ed8ae489-ab40-4ff7-95a3-3ce35e769e5d',
});
