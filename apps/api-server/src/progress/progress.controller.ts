import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@ApiTags('Progress')
@Controller('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('update')
  @ApiOperation({ summary: 'Update lesson progress' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProgress(@Request() req: AuthenticatedRequest, @Body() data: UpdateProgressDto) {
    return this.progressService.updateProgress(
      req.user.id,
      data.lessonId,
      data.status,
      req.user.tenantId,
    );
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get user progress for a specific course' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCourseProgress(
    @Request() req: AuthenticatedRequest,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.progressService.getProgress(req.user.id, courseId, req.user.tenantId);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get user progress for a specific lesson' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLessonProgress(
    @Request() req: AuthenticatedRequest,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.progressService.getLessonProgress(req.user.id, lessonId, req.user.tenantId);
  }
}
