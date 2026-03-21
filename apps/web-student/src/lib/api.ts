import { createApiClient } from "@repo/api-client";

const STUDENT_TENANT_ID = "ed8ae489-ab40-4ff7-95a3-3ce35e769e5d";

export default createApiClient({
  tenantId: STUDENT_TENANT_ID,
});
