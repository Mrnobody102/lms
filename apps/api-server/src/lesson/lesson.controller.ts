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
import { LessonService } from './lesson.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonQueryDto } from './dto/lesson-query.dto';
import { AuthenticatedRequest } from '../progress/dto/authenticated-request.interface';

type RequestWithTenant = AuthenticatedRequest & { tenantId: string };

@ApiBearerAuth()
@ApiTags('lessons')
@Controller('lessons')
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tạo bài học mới' })
  create(@Body() createLessonDto: CreateLessonDto, @Request() req: RequestWithTenant) {
    return this.lessonService.create({
      ...createLessonDto,
      tenantId: req.tenantId,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài học của một khóa học (phân trang)' })
  @ApiQuery({ name: 'courseId', required: true })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('courseId', ParseUUIDPipe) courseId: string,
    @Query() query: LessonQueryDto,
    @Request() req: RequestWithTenant,
  ) {
    return this.lessonService.findAll(courseId, req.tenantId, query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết một bài học' })
  findOne(@Param('id') id: string, @Request() req: RequestWithTenant) {
    return this.lessonService.findOne(id, req.tenantId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cập nhật bài học' })
  update(
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Request() req: RequestWithTenant,
  ) {
    return this.lessonService.update(id, req.tenantId, updateLessonDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Xóa bài học' })
  remove(@Param('id') id: string, @Request() req: RequestWithTenant) {
    return this.lessonService.remove(id, req.tenantId);
  }
}
