import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { AdminBillingService } from './admin-billing.service';
import { UpdateBillingConfigDto } from './dto/update-billing-config.dto';

@ApiTags('Admin - Billing')
@ApiBearerAuth()
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminBillingController {
  constructor(private readonly adminBillingService: AdminBillingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Get billing configuration for the current tenant' })
  @ApiResponse({ status: 200, description: 'Billing configuration retrieved successfully' })
  async getBillingConfig(@CurrentUser() user: AuthenticatedUser) {
    return this.adminBillingService.getBillingConfig(user);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get billing subscription, invoice, and payment overview' })
  @ApiResponse({ status: 200, description: 'Billing overview retrieved successfully' })
  async getBillingOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.adminBillingService.getBillingOverview(user);
  }

  @Patch('config')
  @ApiOperation({ summary: 'Update billing configuration for the current tenant' })
  @ApiResponse({ status: 200, description: 'Billing configuration updated successfully' })
  async updateBillingConfig(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateBillingConfigDto,
  ) {
    return this.adminBillingService.updateBillingConfig(user, dto);
  }
}
