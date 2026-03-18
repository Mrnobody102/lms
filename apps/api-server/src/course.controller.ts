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
} from "@nestjs/common";
import { CourseService } from "./course.service";
import { ApiTags, ApiOperation, ApiQuery, ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID } from "class-validator";

class CreateCourseDto {
  @ApiProperty({ example: "Lập trình Next.js cơ bản" })
  @IsString()
  title: string;
}

@ApiTags("courses")
@Controller("courses")
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @ApiOperation({ summary: "Tạo khóa học mới" })
  create(@Body() createCourseDto: CreateCourseDto, @Request() req: any) {
    // tenantId is injected by TenantMiddleware into req.tenantId
    return this.courseService.create({
      ...createCourseDto,
      tenantId: req.tenantId,
    });
  }

  @Get()
  @ApiOperation({ summary: "Lấy tất cả khóa học của tenant" })
  findAll(@Request() req: any) {
    return this.courseService.findAll(req.tenantId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Lấy chi tiết khóa học kèm bài học" })
  findOne(@Param("id") id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật khóa học" })
  update(@Param("id") id: string, @Body() updateCourseDto: CreateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa khóa học" })
  remove(@Param("id") id: string) {
    return this.courseService.remove(id);
  }
}
