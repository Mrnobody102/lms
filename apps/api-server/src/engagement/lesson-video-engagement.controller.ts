import { Body, Controller, Param, ParseUUIDPipe, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { TrackVideoEngagementEventDto } from './dto/track-video-engagement-event.dto';
import { VideoEngagementService } from './video-engagement.service';

@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LessonVideoEngagementController {
  constructor(private readonly videoEngagementService: VideoEngagementService) {}

  @Post(':id/video-engagement-events')
  @Roles(Role.STUDENT)
  @ApiOperation({ summary: 'Track granular video engagement for a lesson' })
  trackVideoEvent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TrackVideoEngagementEventDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.videoEngagementService.trackLessonEvent(getScopedTenantId(req), req.user, id, dto);
  }
}
