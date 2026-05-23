import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class EnrollCohortDto {
  @ApiProperty({ example: 'uuid-of-course', description: 'Course ID to enroll cohort members in' })
  @IsUUID('4')
  @IsNotEmpty()
  courseId: string;
}
