import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CourseRunService } from './course-run.service';
import { AddRunEnrollmentsDto } from './dto/add-run-enrollments.dto';
import { CreateCourseRunDto } from './dto/create-course-run.dto';
import { CreateRunSessionDto } from './dto/create-run-session.dto';
import { UpdateCourseRunDto } from './dto/update-course-run.dto';
import { UpsertAttendanceDto } from './dto/upsert-attendance.dto';

@ApiTags('Course Runs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
@Controller('course-runs')
export class CourseRunController {
  constructor(private readonly courseRunService: CourseRunService) {}

  @Get()
  @ApiOperation({ summary: 'List course runs visible to the current user' })
  list(@Req() req: AuthenticatedRequest) {
    return this.courseRunService.list(getScopedTenantId(req), req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one course run' })
  get(@Param('id', ParseUUIDPipe) id: string, @Req() req: AuthenticatedRequest) {
    return this.courseRunService.get(getScopedTenantId(req), id, req.user);
  }

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a course run/class' })
  create(@Body() dto: CreateCourseRunDto, @Req() req: AuthenticatedRequest) {
    return this.courseRunService.create(getScopedTenantId(req), dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a course run/class' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseRunDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.courseRunService.update(getScopedTenantId(req), id, dto);
  }

  @Post(':id/enrollments')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add students to a course run' })
  addEnrollments(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddRunEnrollmentsDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.courseRunService.addEnrollments(getScopedTenantId(req), id, dto);
  }

  @Post(':id/sessions')
  @ApiOperation({ summary: 'Create a run session' })
  createSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateRunSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.courseRunService.createSession(getScopedTenantId(req), id, req.user, dto);
  }

  @Post('sessions/:sessionId/attendance')
  @ApiOperation({ summary: 'Upsert attendance for a run session' })
  upsertAttendance(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: UpsertAttendanceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.courseRunService.upsertAttendance(getScopedTenantId(req), sessionId, req.user, dto);
  }
}
