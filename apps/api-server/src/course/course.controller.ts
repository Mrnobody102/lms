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
} from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { AuthenticatedRequest } from '../progress/dto/authenticated-request.interface';

type RequestWithTenant = AuthenticatedRequest & { tenantId: string };

@ApiBearerAuth()
@ApiTags('courses')
@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo khóa học mới' })
  create(@Body() createCourseDto: CreateCourseDto, @Request() req: RequestWithTenant) {
    const { title, slug, totalDuration } = createCourseDto;
    return this.courseService.create({
      title,
      slug,
      totalDuration,
      tenantId: req.tenantId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách khóa học của tenant (phân trang)' })
  findAll(@Query() query: CourseQueryDto, @Request() req: RequestWithTenant) {
    return this.courseService.findAll(req.tenantId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết khóa học kèm bài học' })
  findOne(@Param('id') id: string, @Request() req: RequestWithTenant) {
    return this.courseService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật khóa học' })
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: RequestWithTenant,
  ) {
    return this.courseService.update(id, req.tenantId, {
      title: updateCourseDto.title,
      slug: updateCourseDto.slug,
      totalDuration: updateCourseDto.totalDuration,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xóa khóa học' })
  remove(@Param('id') id: string, @Request() req: RequestWithTenant) {
    return this.courseService.remove(id, req.tenantId);
  }
}
