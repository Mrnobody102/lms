import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  ParseUUIDPipe,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { GradeReviewDto } from './dto/grade-review.dto';
import { CreateCustomCardDto } from './dto/custom-card.dto';
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
    @Query('deck') deck?: string,
    @Query('category') category?: string,
    @Query('courseId') courseId?: string,
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.srs.getQueue(req.user.tenantId, req.user.id, {
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      skill: skill?.trim() || undefined,
      deck: deck?.trim() || undefined,
      category: category?.trim() || undefined,
      courseId: courseId?.trim() || undefined,
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
    return this.srs.submitReview(req.user.tenantId, req.user.id, cardId, dto.grade, dto.durationMs);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get SRS review statistics (heatmap data)' })
  async getReviewStats(@Request() req: AuthenticatedRequest, @Query('days') days?: string) {
    const parsedDays = days ? Number.parseInt(days, 10) : 30;
    return this.srs.getReviewStats(req.user.tenantId, req.user.id, parsedDays);
  }

  @Get('cards/custom')
  @ApiOperation({ summary: 'Get all custom cards for the authenticated user' })
  async getCustomCards(@Request() req: AuthenticatedRequest) {
    return this.srs.getCustomCards(req.user.tenantId, req.user.id);
  }

  @Post('cards/custom')
  @ApiOperation({ summary: 'Create a new custom review card' })
  async createCustomCard(@Request() req: AuthenticatedRequest, @Body() dto: CreateCustomCardDto) {
    return this.srs.createCustomCard(req.user.tenantId, req.user.id, dto);
  }

  @Put('cards/custom/:cardId')
  @ApiOperation({ summary: 'Update an existing custom review card' })
  async updateCustomCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Body() dto: CreateCustomCardDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.srs.updateCustomCard(req.user.tenantId, req.user.id, cardId, dto);
  }

  @Delete('cards/custom/:cardId')
  @ApiOperation({ summary: 'Delete a custom review card' })
  async deleteCustomCard(
    @Param('cardId', ParseUUIDPipe) cardId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    await this.srs.deleteCustomCard(req.user.tenantId, req.user.id, cardId);
    return { deleted: true };
  }
}
