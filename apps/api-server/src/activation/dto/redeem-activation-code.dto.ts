import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemActivationCodeDto {
  @ApiProperty({ description: 'The activation code string to redeem' })
  @IsString()
  @IsNotEmpty()
  code: string;
}
