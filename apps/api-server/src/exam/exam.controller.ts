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
import { ExamAttemptQueryDto } from './dto/exam-attempt-query.dto';
import { CreateExamDto } from './dto/create-exam.dto';
import { ExamQueryDto } from './dto/exam-query.dto';
import { SubmitExamAttemptDto } from './dto/submit-exam-attempt.dto';
import { ExamService } from './exam.service';

@ApiBearerAuth()
@ApiTags('exams')
@Controller('exams')
export class ExamController {
  constructor(private readonly examService: ExamService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an exam template with sections and questions' })
  createExam(@Body() dto: CreateExamDto, @Request() req: AuthenticatedRequest) {
    return this.examService.createExam(getScopedTenantId(req), dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List exams visible to the current user' })
  listExams(@Query() query: ExamQueryDto, @Request() req: AuthenticatedRequest) {
    return this.examService.listExams(getScopedTenantId(req), req.user, query);
  }

  @Get('attempts/:attemptId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Review an exam attempt' })
  getAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.examService.getAttempt(attemptId, getScopedTenantId(req), req.user);
  }

  @Get('attempts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List exam attempts visible to the current user' })
  listAttempts(@Query() query: ExamAttemptQueryDto, @Request() req: AuthenticatedRequest) {
    return this.examService.listAttempts(getScopedTenantId(req), req.user, query);
  }

  @Post('attempts/:attemptId/submit')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit an exam attempt and receive graded feedback' })
  submitAttempt(
    @Param('attemptId', ParseUUIDPipe) attemptId: string,
    @Body() dto: SubmitExamAttemptDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.examService.submitAttempt(attemptId, getScopedTenantId(req), req.user, dto.answers);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an exam template' })
  getExam(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.examService.getExam(id, getScopedTenantId(req), req.user);
  }

  @Post(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start an exam attempt' })
  startAttempt(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.examService.startAttempt(id, getScopedTenantId(req), req.user);
  }
}
