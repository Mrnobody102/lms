import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkEnrollmentDto {
  @ApiProperty({
    description: 'Student user IDs to enroll or unenroll',
    type: [String],
    maxItems: 100,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsUUID(undefined, { each: true })
  userIds: string[];
}
