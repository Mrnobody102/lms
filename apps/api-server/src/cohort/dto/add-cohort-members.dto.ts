import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

export class AddCohortMembersDto {
  @ApiProperty({ description: 'Student user IDs to add to the cohort', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayNotEmpty()
  userIds: string[];
}
