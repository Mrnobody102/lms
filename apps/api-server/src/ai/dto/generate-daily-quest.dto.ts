import { IsOptional, IsString } from 'class-validator';

export class GenerateDailyQuestDto {
  @IsString()
  @IsOptional()
  courseId?: string;
}
