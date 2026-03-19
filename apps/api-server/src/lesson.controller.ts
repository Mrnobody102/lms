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
} from "@nestjs/common";
import { LessonService } from "./lesson.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { CreateLessonDto } from "./lesson/dto/create-lesson.dto";
import { UpdateLessonDto } from "./lesson/dto/update-lesson.dto";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags("lessons")
@Controller("lessons")
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @ApiOperation({ summary: "Tạo bài học mới" })
  create(@Body() createLessonDto: CreateLessonDto, @Request() req: any) {
    return this.lessonService.create({
      ...createLessonDto,
      tenantId: req.tenantId,
    });
  }

  @Get()
  @ApiOperation({ summary: "Lấy tất cả bài học của một khóa học" })
  @ApiQuery({ name: "courseId", required: true })
  findAll(@Query("courseId") courseId: string, @Request() req: any) {
    return this.lessonService.findAll(courseId, req.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một bài học" })
  findOne(@Param("id") id: string, @Request() req: any) {
    return this.lessonService.findOne(id, req.tenantId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật bài học" })
  update(
    @Param("id") id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @Request() req: any,
  ) {
    return this.lessonService.update(id, req.tenantId, updateLessonDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa bài học" })
  remove(@Param("id") id: string, @Request() req: any) {
    return this.lessonService.remove(id, req.tenantId);
  }
}
