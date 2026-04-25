import { createApiClient } from '@repo/api-client';

export default createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
});
