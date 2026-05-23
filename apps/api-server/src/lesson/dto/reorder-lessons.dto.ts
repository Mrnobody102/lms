import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderLessonsDto {
  @ApiProperty({ description: 'The course ID' })
  @IsUUID('4')
  courseId: string;

  @ApiProperty({ description: 'The unit ID' })
  @IsUUID('4')
  unitId: string;

  @ApiProperty({ description: 'List of lesson IDs in the new order', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  lessonIds: string[];
}
