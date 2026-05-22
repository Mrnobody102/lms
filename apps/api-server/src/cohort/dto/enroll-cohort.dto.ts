import { IsString, IsNotEmpty } from 'class-validator';

export class EnrollCohortDto {
  @IsString()
  @IsNotEmpty()
  courseId: string;
}
