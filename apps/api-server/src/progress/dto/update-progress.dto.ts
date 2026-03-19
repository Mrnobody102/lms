import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsUUID } from "class-validator";
import { ProgressStatus } from "@repo/database";

export class UpdateProgressDto {
  @ApiProperty({ example: "uuid-of-lesson", description: "Lesson ID" })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ enum: ProgressStatus, description: "Progress status" })
  @IsEnum(ProgressStatus)
  status: ProgressStatus;
}
