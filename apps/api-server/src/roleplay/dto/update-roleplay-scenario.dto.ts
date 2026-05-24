import { PartialType } from '@nestjs/swagger';
import { CreateRoleplayScenarioDto } from './create-roleplay-scenario.dto';

export class UpdateRoleplayScenarioDto extends PartialType(CreateRoleplayScenarioDto) {}
