import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { AiQuestionGenerationService } from './ai-question-generation.service';
import { AiGenerationJobQueryDto } from './dto/ai-generation-job-query.dto';
import { CreateAiQuestionGenerationJobDto } from './dto/create-ai-question-generation-job.dto';
import { PracticeAttemptQueryDto } from './dto/practice-attempt-query.dto';
import { CreatePracticeQuestionDto } from './dto/create-practice-question.dto';
import { CreatePracticeSetDto } from './dto/create-practice-set.dto';
import { PracticeQueryDto } from './dto/practice-query.dto';
import {
  BulkReviewAiQuestionDraftDto,
  RejectAiQuestionDraftDto,
} from './dto/review-ai-question-draft.dto';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import { UpdateAiQuestionDraftDto } from './dto/update-ai-question-draft.dto';
import { UpdatePracticeQuestionDto } from './dto/update-practice-question.dto';
import { UpdatePracticeSetDto } from './dto/update-practice-set.dto';
import { PracticeService } from './practice.service';

import { GeneratePracticeDto } from './dto/generate-practice.dto';

@ApiBearerAuth()
@ApiTags('practice')
@Controller('practice')
export class PracticeController {
  constructor(
    private readonly practiceService: PracticeService,
    private readonly aiQuestionGenerationService: AiQuestionGenerationService,
  ) {}

  @Post('generate-ai')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Generate practice questions using AI' })
  generateAiQuestions(@Body() dto: GeneratePracticeDto, @Request() req: AuthenticatedRequest) {
    return this.aiQuestionGenerationService.createJobAndGenerate(
      getScopedTenantId(req),
      req.user.id,
      dto,
    );
  }

  @Post('ai-generations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create an AI question generation job' })
  createAiGenerationJob(
    @Body() dto: CreateAiQuestionGenerationJobDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.aiQuestionGenerationService.createJobAndGenerate(
      getScopedTenantId(req),
      req.user.id,
      dto,
    );
  }

  @Get('ai-generations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List AI question generation jobs' })
  listAiGenerationJobs(
    @Query() query: AiGenerationJobQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.aiQuestionGenerationService.listJobs(getScopedTenantId(req), query);
  }

  @Get('ai-generations/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get an AI question generation job with drafts' })
  getAiGenerationJob(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.aiQuestionGenerationService.getJob(getScopedTenantId(req), id);
  }

  @Post('ai-drafts/bulk-approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Bulk approve AI generated question drafts' })
  bulkApproveAiDrafts(
    @Body() dto: BulkReviewAiQuestionDraftDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.aiQuestionGenerationService.bulkApproveDrafts(
      getScopedTenantId(req),
      dto.ids,
      req.user.id,
    );
  }

  @Post('ai-drafts/bulk-reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Bulk reject AI generated question drafts' })
  bulkRejectAiDrafts(
    @Body() dto: BulkReviewAiQuestionDraftDto,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!dto.rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.aiQuestionGenerationService.bulkRejectDrafts(
      getScopedTenantId(req),
      dto.ids,
      req.user.id,
      dto.rejectionReason,
    );
  }

  @Patch('ai-drafts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Edit an AI generated question draft before review' })
  updateAiDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAiQuestionDraftDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.aiQuestionGenerationService.updateDraft(getScopedTenantId(req), id, dto);
  }

  @Post('ai-drafts/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Approve an AI generated question draft' })
  approveAiDraft(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.aiQuestionGenerationService.approveDraft(getScopedTenantId(req), id, req.user.id);
  }

  @Post('ai-drafts/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Reject an AI generated question draft' })
  rejectAiDraft(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectAiQuestionDraftDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.aiQuestionGenerationService.rejectDraft(
      getScopedTenantId(req),
      id,
      req.user.id,
      dto.rejectionReason,
    );
  }

  @Get('review-queue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List practice questions pending review' })
  listPendingReview(@Query() query: PracticeQueryDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.listPendingReview(getScopedTenantId(req), query);
  }

  @Post('review-queue/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve an AI-generated practice question' })
  approveQuestion(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.practiceService.approveQuestion(id, getScopedTenantId(req));
  }

  @Post('review-queue/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject an AI-generated practice question' })
  rejectQuestion(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.practiceService.rejectQuestion(id, getScopedTenantId(req));
  }

  @Post('review-queue/bulk-approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk approve AI-generated practice questions' })
  bulkApproveQuestions(
    @Body() dto: import('./dto/bulk-review.dto').BulkReviewDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.practiceService.bulkApproveQuestions(dto.ids, getScopedTenantId(req));
  }

  @Post('review-queue/bulk-reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Bulk reject AI-generated practice questions' })
  bulkRejectQuestions(
    @Body() dto: import('./dto/bulk-review.dto').BulkReviewDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.practiceService.bulkRejectQuestions(dto.ids, getScopedTenantId(req));
  }

  @Post('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a practice question' })
  createQuestion(@Body() dto: CreatePracticeQuestionDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.createQuestion(getScopedTenantId(req), dto);
  }

  @Patch('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a practice question' })
  updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePracticeQuestionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.practiceService.updateQuestion(id, getScopedTenantId(req), dto);
  }

  @Delete('questions/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a practice question' })
  deleteQuestion(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.practiceService.removeQuestion(id, getScopedTenantId(req));
  }

  @Get('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List practice questions for admin question bank' })
  listQuestions(@Query() query: PracticeQueryDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.listQuestions(getScopedTenantId(req), query);
  }

  @Post('exercise-sets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a practice exercise set' })
  createExerciseSet(@Body() dto: CreatePracticeSetDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.createExerciseSet(getScopedTenantId(req), dto);
  }

  @Patch('exercise-sets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a practice exercise set' })
  updateExerciseSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePracticeSetDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.practiceService.updateExerciseSet(id, getScopedTenantId(req), dto);
  }

  @Delete('exercise-sets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a practice exercise set' })
  deleteExerciseSet(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.practiceService.removeExerciseSet(id, getScopedTenantId(req));
  }

  @Get('exercise-sets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List practice exercise sets visible to the current user' })
  listExerciseSets(@Query() query: PracticeQueryDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.listExerciseSets(getScopedTenantId(req), req.user, query);
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List recommended practice sets for the current student context' })
  listRecommendations(@Query() query: PracticeQueryDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.listRecommendations(getScopedTenantId(req), req.user, query);
  }

  @Get('exercise-sets/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a practice exercise set' })
  getExerciseSet(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.practiceService.getExerciseSet(id, getScopedTenantId(req), req.user);
  }

  @Get('attempts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List practice attempts visible to the current user' })
  listAttempts(@Query() query: PracticeAttemptQueryDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.listAttempts(getScopedTenantId(req), req.user, query);
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Review a practice attempt' })
  getAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.practiceService.getAttempt(attemptId, getScopedTenantId(req), req.user);
  }

  @Post('exercise-sets/:id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a practice attempt and receive immediate feedback' })
  submitAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitPracticeAttemptDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.practiceService.submitAttempt(id, getScopedTenantId(req), req.user, dto.answers);
  }
}
