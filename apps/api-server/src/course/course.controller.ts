import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { CreateCourseUnitDto } from './dto/create-course-unit.dto';
import { UpdateCourseUnitDto } from './dto/update-course-unit.dto';

@ApiBearerAuth()
@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo khóa học mới' })
  create(@Body() createCourseDto: CreateCourseDto, @Request() req: AuthenticatedRequest) {
    const { title, slug, description, totalDuration, aiSettings, levelId } = createCourseDto;

    return this.courseService.create({
      title,
      slug,
      description,
      totalDuration,
      aiSettings,
      levelId,
      tenantId: getScopedTenantId(req),
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách khóa học của tenant (phân trang)' })
  findAll(@Query() query: CourseQueryDto, @Request() req: AuthenticatedRequest) {
    return this.courseService.findAll(getScopedTenantId(req), req.user, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết khóa học kèm bài học' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.courseService.findOne(id, getScopedTenantId(req), req.user);
  }

  @Get(':id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get enrollment progress report for a course' })
  getEnrollmentReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.getEnrollmentReport(id, getScopedTenantId(req));
  }

  @Post(':id/units')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a unit/chapter inside a course' })
  createUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createCourseUnitDto: CreateCourseUnitDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.createUnit(id, getScopedTenantId(req), createCourseUnitDto);
  }

  @Patch(':id/units/:unitId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a unit/chapter inside a course' })
  updateUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() updateCourseUnitDto: UpdateCourseUnitDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.updateUnit(id, unitId, getScopedTenantId(req), updateCourseUnitDto);
  }

  @Delete(':id/units/:unitId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a unit/chapter and keep its lessons ungrouped' })
  removeUnit(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.removeUnit(id, unitId, getScopedTenantId(req));
  }

  @Post(':id/enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Enroll a student into a course' })
  enrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() enrollStudentDto: EnrollStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.enrollStudent(id, getScopedTenantId(req), enrollStudentDto.userId);
  }

  @Delete(':id/enrollments/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Unenroll a student from a course' })
  unenrollStudent(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.unenrollStudent(id, getScopedTenantId(req), userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật khóa học' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.courseService.update(id, getScopedTenantId(req), {
      title: updateCourseDto.title,
      slug: updateCourseDto.slug,
      description: updateCourseDto.description,
      totalDuration: updateCourseDto.totalDuration,
      aiSettings: updateCourseDto.aiSettings,
      levelId: updateCourseDto.levelId,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xóa khóa học' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.courseService.remove(id, getScopedTenantId(req));
  }
}
