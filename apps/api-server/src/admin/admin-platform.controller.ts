import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { AdminPlatformService } from './admin-platform.service';
import { PlatformAuditLogQueryDto, PlatformTenantQueryDto } from './dto/platform-query.dto';
import { UpdatePlatformFeatureFlagsDto } from './dto/update-platform-feature-flags.dto';
import { UpdatePlatformSubscriptionDto } from './dto/update-platform-subscription.dto';

@ApiTags('Admin - Platform')
@ApiBearerAuth()
@Controller('admin/platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminPlatformController {
  constructor(private readonly adminPlatformService: AdminPlatformService) {}

  @Get('usage')
  @ApiOperation({ summary: 'Get platform usage by tenant' })
  @ApiResponse({ status: 200, description: 'Platform usage retrieved successfully' })
  getUsage(@Query() query: PlatformTenantQueryDto) {
    return this.adminPlatformService.getUsage(query);
  }

  @Get('billing')
  @ApiOperation({ summary: 'Get platform billing data' })
  @ApiResponse({ status: 200, description: 'Platform billing data retrieved successfully' })
  getBilling(@Query() query: PlatformTenantQueryDto) {
    return this.adminPlatformService.getBilling(query);
  }

  @Patch('subscriptions/:id')
  @ApiOperation({ summary: 'Update a platform tenant subscription' })
  @ApiResponse({ status: 200, description: 'Subscription updated successfully' })
  updateSubscription(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePlatformSubscriptionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminPlatformService.updateSubscription(id, dto, user);
  }

  @Get('domains')
  @ApiOperation({ summary: 'Get platform tenant domain states' })
  @ApiResponse({ status: 200, description: 'Domain states retrieved successfully' })
  getDomains(@Query() query: PlatformTenantQueryDto) {
    return this.adminPlatformService.getDomains(query);
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'Get platform feature flags by tenant' })
  @ApiResponse({ status: 200, description: 'Feature flags retrieved successfully' })
  getFeatureFlags(@Query() query: PlatformTenantQueryDto) {
    return this.adminPlatformService.getFeatureFlags(query);
  }

  @Patch('feature-flags/:tenantId')
  @ApiOperation({ summary: 'Update platform feature flags for a tenant' })
  @ApiResponse({ status: 200, description: 'Feature flags updated successfully' })
  updateFeatureFlags(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: UpdatePlatformFeatureFlagsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.adminPlatformService.updateFeatureFlags(tenantId, dto, user);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get platform audit logs' })
  @ApiResponse({ status: 200, description: 'Audit logs retrieved successfully' })
  getAuditLogs(@Query() query: PlatformAuditLogQueryDto) {
    return this.adminPlatformService.getAuditLogs(query);
  }

  @Get('incidents')
  @ApiOperation({ summary: 'Get platform incidents from real alerts and audit failures' })
  @ApiResponse({ status: 200, description: 'Platform incidents retrieved successfully' })
  getIncidents() {
    return this.adminPlatformService.getIncidents();
  }

  @Get('ai-status')
  @ApiOperation({ summary: 'Get platform AI provider status from environment-managed config' })
  @ApiResponse({ status: 200, description: 'AI provider status retrieved successfully' })
  getAiStatus() {
    return this.adminPlatformService.getAiStatus();
  }
}
