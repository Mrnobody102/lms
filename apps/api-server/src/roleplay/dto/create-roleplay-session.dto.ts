import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleplaySessionDto {
  @ApiProperty({ description: 'The scenario or prompt for the roleplay' })
  @IsString()
  @IsNotEmpty()
  scenario: string;
}
