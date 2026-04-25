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
    const { title, slug, description, totalDuration } = createCourseDto;

    return this.courseService.create({
      title,
      slug,
      description,
      totalDuration,
      tenantId: getScopedTenantId(req),
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách khóa học của tenant (phân trang)' })
  findAll(@Query() query: CourseQueryDto, @Request() req: AuthenticatedRequest) {
    return this.courseService.findAll(getScopedTenantId(req), query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết khóa học kèm bài học' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.courseService.findOne(id, getScopedTenantId(req));
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
