import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { LessonService } from "./lesson.service";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiProperty,
  ApiPropertyOptional,
} from "@nestjs/swagger";
import { IsString, IsOptional, IsInt, IsUUID } from "class-validator";

class CreateLessonDto {
  @ApiProperty({ example: "Introduction to NestJS" })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: "Lesson content here..." })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: "https://youtube.com/..." })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiProperty({ example: "uuid-of-course" })
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional({ example: "video", enum: ["video", "text", "quiz"] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  quiz?: any;
}

class UpdateLessonDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ enum: ["video", "text", "quiz"] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  quiz?: any;
}

@ApiTags("lessons")
@Controller("lessons")
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @ApiOperation({ summary: "Tạo bài học mới" })
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonService.create(createLessonDto);
  }

  @Get()
  @ApiOperation({ summary: "Lấy tất cả bài học của một khóa học" })
  @ApiQuery({ name: "courseId", required: true })
  findAll(@Query("courseId") courseId: string) {
    return this.lessonService.findAll(courseId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết một bài học" })
  findOne(@Param("id") id: string) {
    return this.lessonService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật bài học" })
  update(@Param("id") id: string, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonService.update(id, updateLessonDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa bài học" })
  remove(@Param("id") id: string) {
    return this.lessonService.remove(id);
  }
}
