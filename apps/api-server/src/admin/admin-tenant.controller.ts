import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@repo/database";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CreateTenantDto } from "./dto/create-tenant.dto";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth()
@Controller("admin/tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminTenantController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    return this.adminService.createTenant(createTenantDto);
  }

  @Get()
  async getTenants() {
    return this.adminService.getTenants();
  }

  @Get(":id")
  async getTenantById(@Param("id") id: string) {
    return this.adminService.getTenantById(id);
  }

  @Put(":id")
  async updateTenant(
    @Param("id") id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.adminService.updateTenant(id, updateTenantDto);
  }

  @Delete(":id")
  async deleteTenant(@Param("id") id: string) {
    return this.adminService.deleteTenant(id);
  }

  @Patch(":id/restore")
  async restoreTenant(@Param("id") id: string) {
    return this.adminService.restoreTenant(id);
  }
}
