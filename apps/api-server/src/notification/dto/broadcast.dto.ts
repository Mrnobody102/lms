import { IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export enum NotificationType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
}

export class BroadcastNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  content?: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType = NotificationType.INFO;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @Matches(/^\/(?!\/)[^\s]*$/, {
    message: 'actionUrl must be an internal path starting with /',
  })
  actionUrl?: string;
}
