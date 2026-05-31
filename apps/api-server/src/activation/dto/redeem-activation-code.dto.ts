import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class RedeemActivationCodeDto {
  @ApiProperty({ description: 'The activation code string to redeem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[A-Z0-9-]+$/, {
    message: 'Activation code must use uppercase letters, numbers, or hyphens',
  })
  code: string;
}
