import { Module } from "@nestjs/common";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminTenantController } from "./admin-tenant.controller";

@Module({
  controllers: [AdminController, AdminTenantController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
