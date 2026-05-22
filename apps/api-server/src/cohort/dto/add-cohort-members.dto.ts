import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class AddCohortMembersDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayNotEmpty()
  userIds: string[];
}
