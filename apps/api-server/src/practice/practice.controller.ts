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
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { PracticeAttemptQueryDto } from './dto/practice-attempt-query.dto';
import { CreatePracticeQuestionDto } from './dto/create-practice-question.dto';
import { CreatePracticeSetDto } from './dto/create-practice-set.dto';
import { PracticeQueryDto } from './dto/practice-query.dto';
import { SubmitPracticeAttemptDto } from './dto/submit-practice-attempt.dto';
import { PracticeService } from './practice.service';

@ApiBearerAuth()
@ApiTags('practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Post('questions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a practice question' })
  createQuestion(@Body() dto: CreatePracticeQuestionDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.createQuestion(getScopedTenantId(req), dto);
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

  @Get('exercise-sets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List practice exercise sets visible to the current user' })
  listExerciseSets(@Query() query: PracticeQueryDto, @Request() req: AuthenticatedRequest) {
    return this.practiceService.listExerciseSets(getScopedTenantId(req), req.user, query);
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
