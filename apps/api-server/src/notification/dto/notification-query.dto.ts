import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class NotificationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  skip = 0;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  take = 20;
}
