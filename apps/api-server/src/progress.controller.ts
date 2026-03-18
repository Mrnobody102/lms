import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { ProgressService } from "./progress.service";
import { ProgressStatus } from "@repo/database";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
  };
}

import { IsEnum, IsUUID } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateProgressDto {
  @ApiProperty()
  @IsUUID()
  lessonId: string;

  @ApiProperty({ enum: ProgressStatus })
  @IsEnum(ProgressStatus)
  status: ProgressStatus;
}

@ApiTags("Progress")
@Controller("progress")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post("update")
  @ApiOperation({ summary: "Update lesson progress" })
  async updateProgress(
    @Request() req: AuthenticatedRequest,
    @Body() data: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(
      req.user.id,
      data.lessonId,
      data.status,
      req.user.tenantId,
    );
  }

  @Get("course/:courseId")
  @ApiOperation({ summary: "Get user progress for a specific course" })
  async getCourseProgress(
    @Request() req: AuthenticatedRequest,
    @Param("courseId") courseId: string,
  ) {
    return this.progressService.getProgress(
      req.user.id,
      courseId,
      req.user.tenantId,
    );
  }

  @Get("lesson/:lessonId")
  @ApiOperation({ summary: "Get user progress for a specific lesson" })
  async getLessonProgress(
    @Request() req: AuthenticatedRequest,
    @Param("lessonId") lessonId: string,
  ) {
    return this.progressService.getLessonProgress(
      req.user.id,
      lessonId,
      req.user.tenantId,
    );
  }
}
