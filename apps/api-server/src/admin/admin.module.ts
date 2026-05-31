import { Module } from '@nestjs/common';
import { MetricsModule } from '../common/metrics/metrics.module';
import { AdminController } from './admin.controller';
import { AdminBillingController } from './admin-billing.controller';
import { AdminBillingService } from './admin-billing.service';
import { AdminOverviewController } from './admin-overview.controller';
import { AdminOverviewService } from './admin-overview.service';
import { AdminTenantController } from './admin-tenant.controller';
import { UserAdminService } from './user-admin.service';
import { TenantAdminService } from './tenant-admin.service';

import { AdminSystemController } from './admin-system.controller';
import { AdminSystemService } from './admin-system.service';
import { AdminPlatformController } from './admin-platform.controller';
import { AdminPlatformService } from './admin-platform.service';

@Module({
  imports: [MetricsModule],
  controllers: [
    AdminController,
    AdminBillingController,
    AdminOverviewController,
    AdminTenantController,
    AdminSystemController,
    AdminPlatformController,
  ],
  providers: [
    UserAdminService,
    AdminBillingService,
    AdminOverviewService,
    TenantAdminService,
    AdminSystemService,
    AdminPlatformService,
  ],
  exports: [
    UserAdminService,
    AdminBillingService,
    AdminOverviewService,
    TenantAdminService,
    AdminSystemService,
    AdminPlatformService,
  ],
})
export class AdminModule {}
