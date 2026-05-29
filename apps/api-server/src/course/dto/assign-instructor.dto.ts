import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignInstructorDto {
  @ApiProperty({ description: 'Instructor user ID' })
  @IsUUID()
  instructorId: string;
}
