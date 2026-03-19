import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateCourseDto {
  @ApiProperty({ example: "Lập trình Next.js cơ bản", description: "Course title" })
  @IsString()
  title: string;
}
