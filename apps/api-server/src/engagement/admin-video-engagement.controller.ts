import { Controller, Get, Param, ParseUUIDPipe, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { VideoHeatmapQueryDto } from './dto/video-heatmap-query.dto';
import { VideoEngagementService } from './video-engagement.service';

@ApiTags('Admin - Reports')
@ApiBearerAuth()
@Controller('admin/reports/video-engagement')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
export class AdminVideoEngagementController {
  constructor(private readonly videoEngagementService: VideoEngagementService) {}

  @Get('lessons/:lessonId/heatmap')
  @ApiOperation({ summary: 'Video engagement heatmap for a lesson' })
  getLessonHeatmap(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Query() query: VideoHeatmapQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.videoEngagementService.getLessonHeatmap(getScopedTenantId(req), lessonId, query);
  }
}
