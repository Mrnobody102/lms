import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderUnitsDto {
  @ApiProperty({ description: 'List of unit IDs in the new order', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  unitIds: string[];
}
