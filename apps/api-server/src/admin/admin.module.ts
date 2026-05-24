import { Module } from '@nestjs/common';
import { MetricsModule } from '../common/metrics/metrics.module';
import { AdminController } from './admin.controller';
import { AdminOverviewController } from './admin-overview.controller';
import { AdminOverviewService } from './admin-overview.service';
import { AdminTenantController } from './admin-tenant.controller';
import { UserAdminService } from './user-admin.service';
import { TenantAdminService } from './tenant-admin.service';

import { AdminSystemController } from './admin-system.controller';
import { AdminSystemService } from './admin-system.service';

@Module({
  imports: [MetricsModule],
  controllers: [
    AdminController,
    AdminOverviewController,
    AdminTenantController,
    AdminSystemController,
  ],
  providers: [UserAdminService, AdminOverviewService, TenantAdminService, AdminSystemService],
  exports: [UserAdminService, AdminOverviewService, TenantAdminService, AdminSystemService],
})
export class AdminModule {}
