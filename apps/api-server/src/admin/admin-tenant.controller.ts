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
  Query,
} from '@nestjs/common';
import { Role } from '@repo/database';
import { TenantAdminService } from './tenant-admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Admin - Tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminTenantController {
  constructor(private readonly tenantAdminService: TenantAdminService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createTenant(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantAdminService.createTenant(createTenantDto);
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
  async getTenantById(@Param('id') id: string) {
    return this.tenantAdminService.getTenantById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantAdminService.updateTenant(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(@Param('id') id: string) {
    return this.tenantAdminService.deleteTenant(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a deleted tenant' })
  @ApiResponse({ status: 200, description: 'Tenant restored successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async restoreTenant(@Param('id') id: string) {
    return this.tenantAdminService.restoreTenant(id);
  }
}
