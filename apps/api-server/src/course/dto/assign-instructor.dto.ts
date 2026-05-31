import { ApiProperty } from '@nestjs/swagger';
import { CourseInstructorRole } from '@repo/database';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

export class AssignInstructorDto {
  @ApiProperty({ description: 'Instructor user ID' })
  @IsUUID()
  instructorId: string;

  @ApiProperty({ enum: CourseInstructorRole, required: false })
  @IsEnum(CourseInstructorRole)
  @IsOptional()
  role?: CourseInstructorRole;
}
