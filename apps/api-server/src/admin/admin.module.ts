import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminOverviewController } from './admin-overview.controller';
import { AdminOverviewService } from './admin-overview.service';
import { AdminTenantController } from './admin-tenant.controller';
import { UserAdminService } from './user-admin.service';
import { TenantAdminService } from './tenant-admin.service';

@Module({
  controllers: [AdminController, AdminOverviewController, AdminTenantController],
  providers: [UserAdminService, AdminOverviewService, TenantAdminService],
  exports: [UserAdminService, AdminOverviewService, TenantAdminService],
})
export class AdminModule {}
