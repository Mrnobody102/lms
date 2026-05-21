import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export type GoogleLoginPortal = 'student' | 'admin' | 'super';

export class GoogleLoginDto {
  @ApiProperty({ description: 'Google Identity Services ID token credential' })
  @IsString()
  @MinLength(20)
  credential: string;

  @ApiPropertyOptional({
    enum: ['student', 'admin', 'super'],
    default: 'student',
    description: 'Portal requesting the login; used to prevent accidental auto-provisioning.',
  })
  @IsOptional()
  @IsIn(['student', 'admin', 'super'])
  portal?: GoogleLoginPortal = 'student';
}
