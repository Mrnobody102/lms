import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@repo/database';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';

@ApiTags('Programs & Levels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('programs')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new program' })
  create(@Body() createProgramDto: CreateProgramDto, @Request() req: AuthenticatedRequest) {
    return this.programService.create(createProgramDto, getScopedTenantId(req));
  }

  @Get()
  @ApiOperation({ summary: 'Get all programs with levels' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.programService.findAll(getScopedTenantId(req));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a program with its levels' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.programService.findOne(id, getScopedTenantId(req));
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a program' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProgramDto: UpdateProgramDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.programService.update(id, getScopedTenantId(req), updateProgramDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a program' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: AuthenticatedRequest) {
    return this.programService.remove(id, getScopedTenantId(req));
  }

  // --- Level Endpoints ---

  @Post(':id/levels')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a level for a program' })
  createLevel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createLevelDto: CreateLevelDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.programService.createLevel(id, getScopedTenantId(req), createLevelDto);
  }

  @Patch(':id/levels/:levelId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a level' })
  updateLevel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('levelId', ParseUUIDPipe) levelId: string,
    @Body() updateLevelDto: UpdateLevelDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.programService.updateLevel(levelId, id, getScopedTenantId(req), updateLevelDto);
  }

  @Delete(':id/levels/:levelId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft delete a level' })
  removeLevel(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('levelId', ParseUUIDPipe) levelId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.programService.removeLevel(levelId, id, getScopedTenantId(req));
  }
}
