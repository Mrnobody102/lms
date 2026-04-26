import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { AdminOverviewService } from './admin-overview.service';

@ApiTags('Admin - Overview')
@ApiBearerAuth()
@Controller('admin/overview')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminOverviewController {
  constructor(private readonly adminOverviewService: AdminOverviewService) {}

  @Get()
  @ApiOperation({ summary: 'Get tenant-level admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  async getOverview(@Request() req: AuthenticatedRequest) {
    return this.adminOverviewService.getOverview({
      tenantId: getScopedTenantId(req),
    });
  }
}
