import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminSystemService } from './admin-system.service';

@ApiTags('Admin - System')
@ApiBearerAuth()
@Controller('admin/system')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminSystemController {
  constructor(private readonly adminSystemService: AdminSystemService) {}

  @Get('telemetry')
  @ApiOperation({ summary: 'Get global system telemetry (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Telemetry retrieved successfully' })
  async getTelemetry() {
    return this.adminSystemService.getSystemTelemetry();
  }
}
