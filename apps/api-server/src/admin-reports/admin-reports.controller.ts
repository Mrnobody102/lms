import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { AdminReportsService } from './admin-reports.service';
import { buildCsv } from './admin-reports.csv';

@ApiTags('Admin - Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminReportsController {
  constructor(private readonly reportsService: AdminReportsService) {}

  @Get('programs')
  @ApiOperation({ summary: 'Programs rollup with completion + accuracy metrics' })
  getPrograms(@Request() req: AuthenticatedRequest) {
    return this.reportsService.getProgramsRollup(getScopedTenantId(req));
  }

  @Get('programs/:programId')
  @ApiOperation({ summary: 'Program detail with per-level rollup' })
  getProgram(
    @Request() req: AuthenticatedRequest,
    @Param('programId', ParseUUIDPipe) programId: string,
  ) {
    return this.reportsService.getProgramDetail(getScopedTenantId(req), programId);
  }

  @Get('levels/:levelId')
  @ApiOperation({ summary: 'Level detail with per-course rollup' })
  getLevel(@Request() req: AuthenticatedRequest, @Param('levelId', ParseUUIDPipe) levelId: string) {
    return this.reportsService.getLevelDetail(getScopedTenantId(req), levelId);
  }

  @Get('courses/:courseId/units')
  @ApiOperation({ summary: 'Per-unit rollup for a course' })
  getCourseUnits(
    @Request() req: AuthenticatedRequest,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.reportsService.getCourseUnits(getScopedTenantId(req), courseId);
  }

  @Get('courses/:courseId/students')
  @ApiOperation({ summary: 'Per-student performance for a course' })
  getCourseStudents(
    @Request() req: AuthenticatedRequest,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.reportsService.getCourseStudents(getScopedTenantId(req), courseId);
  }

  @Get('skills')
  @ApiOperation({ summary: 'Accuracy by skill across the tenant (optionally filtered)' })
  getSkills(
    @Request() req: AuthenticatedRequest,
    @Query('courseId') courseId?: string,
    @Query('programId') programId?: string,
  ) {
    return this.reportsService.getSkillsAccuracy(getScopedTenantId(req), {
      courseId,
      programId,
    });
  }

  @Get('courses/:courseId/students.csv')
  @ApiOperation({ summary: 'CSV export of per-student performance for a course' })
  async getCourseStudentsCsv(
    @Request() req: AuthenticatedRequest,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getCourseStudents(getScopedTenantId(req), courseId);
    const rows = data.students.slice(0, AdminReportsService.CSV_ROW_CAP);
    const csv = buildCsv(rows, [
      { header: 'Full Name', value: (r) => r.fullName },
      { header: 'Email', value: (r) => r.email },
      { header: 'Active', value: (r) => (r.isActive ? 'yes' : 'no') },
      { header: 'Enrolled At', value: (r) => r.enrolledAt.toISOString() },
      { header: 'Completed Lessons', value: (r) => r.completedLessons },
      { header: 'Total Lessons', value: (r) => r.totalLessons },
      { header: 'Completion %', value: (r) => r.completionPercentage },
      { header: 'Practice Accuracy %', value: (r) => r.practiceAccuracy },
      { header: 'Practice Attempts', value: (r) => r.practiceAttempts },
      { header: 'Exam Accuracy %', value: (r) => r.examAccuracy },
      { header: 'Exam Attempts', value: (r) => r.examAttempts },
      {
        header: 'Last Activity At',
        value: (r) => (r.lastActivityAt ? r.lastActivityAt.toISOString() : ''),
      },
    ]);
    sendCsv(res, `course-${courseId}-students.csv`, csv);
  }

  @Get('courses/:courseId/units.csv')
  @ApiOperation({ summary: 'CSV export of per-unit accuracy for a course' })
  async getCourseUnitsCsv(
    @Request() req: AuthenticatedRequest,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Res() res: Response,
  ) {
    const data = await this.reportsService.getCourseUnits(getScopedTenantId(req), courseId);
    const rows = data.units.slice(0, AdminReportsService.CSV_ROW_CAP);
    const csv = buildCsv(rows, [
      { header: 'Unit', value: (r) => r.title },
      { header: 'Order', value: (r) => r.order },
      { header: 'Lessons', value: (r) => r.lessonCount },
      { header: 'Total Questions', value: (r) => r.totalQuestions },
      { header: 'Accuracy %', value: (r) => r.accuracy },
    ]);
    sendCsv(res, `course-${courseId}-units.csv`, csv);
  }

  @Get('skills.csv')
  @ApiOperation({ summary: 'CSV export of accuracy-by-skill snapshot' })
  async getSkillsCsv(
    @Request() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query('courseId') courseId?: string,
    @Query('programId') programId?: string,
  ) {
    const data = await this.reportsService.getSkillsAccuracy(getScopedTenantId(req), {
      courseId,
      programId,
    });
    const rows = data.accuracyBySkill.slice(0, AdminReportsService.CSV_ROW_CAP);
    const csv = buildCsv(rows, [
      { header: 'Skill', value: (r) => r.skill },
      { header: 'Total Questions', value: (r) => r.totalQuestions },
      { header: 'Accuracy %', value: (r) => r.accuracy },
    ]);
    sendCsv(res, `skills.csv`, csv);
  }
}

function sendCsv(res: Response, filename: string, csv: string) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}
