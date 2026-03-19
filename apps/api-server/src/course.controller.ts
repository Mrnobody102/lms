import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from "@nestjs/common";
import { CourseService } from "./course.service";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { CreateCourseDto } from "./course/dto/create-course.dto";
import { UpdateCourseDto } from "./course/dto/update-course.dto";

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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
  findOne(@Param("id") id: string, @Request() req: any) {
    return this.courseService.findOne(id, req.tenantId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Cập nhật khóa học" })
  update(
    @Param("id") id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: any,
  ) {
    return this.courseService.update(id, req.tenantId, updateCourseDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Xóa khóa học" })
  remove(@Param("id") id: string, @Request() req: any) {
    return this.courseService.remove(id, req.tenantId);
  }
}
