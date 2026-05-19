import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { GradeReviewDto } from './dto/grade-review.dto';
import { SrsService } from './srs.service';

@ApiBearerAuth()
@ApiTags('srs')
@Controller('srs')
@UseGuards(JwtAuthGuard)
export class SrsController {
  constructor(private readonly srs: SrsService) {}

  @Get('queue')
  @ApiOperation({ summary: 'Get current SRS review queue for the authenticated user' })
  async getQueue(
    @Request() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('skill') skill?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.srs.getQueue(req.user.tenantId, req.user.id, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      skill: skill?.trim() || undefined,
    });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get SRS due card counts for the authenticated user' })
  async getSummary(@Request() req: AuthenticatedRequest) {
    return this.srs.getDueSummary(req.user.tenantId, req.user.id);
  }

  @Post('review/:cardId')
  @ApiOperation({ summary: 'Apply a grade to a review card and reschedule it' })
  async submitReview(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: GradeReviewDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.srs.submitReview(req.user.tenantId, req.user.id, cardId, dto.grade);
  }
}
