import { createApiClient } from "@repo/api-client";

const ADMIN_TENANT_ID = "ed8ae489-ab40-4ff7-95a3-3ce35e769e5d";

export default createApiClient({
  tenantId: ADMIN_TENANT_ID,
  onUnauthorized: () => {
    const returnUrl = window.location.pathname;
    const locale = returnUrl.match(/^\/(en|vi)\//)?.[1] || "vi";
    window.location.href = `/${locale}/login`;
  },
});
