import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminTenantController } from './admin-tenant.controller';
import { UserAdminService } from './user-admin.service';
import { TenantAdminService } from './tenant-admin.service';

@Module({
  controllers: [AdminController, AdminTenantController],
  providers: [UserAdminService, TenantAdminService],
  exports: [UserAdminService, TenantAdminService],
})
export class AdminModule {}
