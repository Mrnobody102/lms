import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  ParseUUIDPipe,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Role } from '@repo/database';
import { TenantAdminService } from './tenant-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminPlatformService } from './admin-platform.service';

@ApiTags('Admin - Tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminTenantController {
  constructor(
    private readonly tenantAdminService: TenantAdminService,
    private readonly adminPlatformService: AdminPlatformService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantAdminService.createTenant(createTenantDto, user);
  }

  @Get(':id/overview')
  @ApiOperation({ summary: 'Get tenant operations overview by ID' })
  @ApiResponse({ status: 200, description: 'Tenant overview retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantOverview(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminPlatformService.getTenantOverview(id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getTenants(@Query('includeInactive') includeInactive?: string) {
    return this.tenantAdminService.getAllTenants(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tenant by ID' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenantById(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantAdminService.getTenantById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantAdminService.updateTenant(id, updateTenantDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantAdminService.deleteTenant(id, user);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted tenant' })
  @ApiResponse({ status: 200, description: 'Tenant restored successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async restoreTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.tenantAdminService.restoreTenant(id, user);
  }
}
