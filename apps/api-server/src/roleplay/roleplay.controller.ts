import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CreateRoleplayAudioMessageDto } from './dto/create-roleplay-audio-message.dto';
import { CreateRoleplayScenarioDto } from './dto/create-roleplay-scenario.dto';
import { CreateRoleplaySessionDto } from './dto/create-roleplay-session.dto';
import { RoleplayScenarioQueryDto } from './dto/roleplay-scenario-query.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateRoleplayScenarioDto } from './dto/update-roleplay-scenario.dto';
import { RoleplayScenarioService } from './roleplay-scenario.service';
import { RoleplayService } from './roleplay.service';

@ApiTags('Roleplay')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roleplay')
export class RoleplayController {
  constructor(
    private readonly roleplayService: RoleplayService,
    private readonly scenarioService: RoleplayScenarioService,
  ) {}

  @Post('scenarios')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Create a roleplay scenario' })
  createScenario(@Request() req: AuthenticatedRequest, @Body() dto: CreateRoleplayScenarioDto) {
    return this.scenarioService.create(getScopedTenantId(req), dto);
  }

  @Get('scenarios')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'List roleplay scenarios for admin review' })
  listScenarios(@Request() req: AuthenticatedRequest, @Query() query: RoleplayScenarioQueryDto) {
    return this.scenarioService.list(getScopedTenantId(req), query);
  }

  @Get('scenarios/available')
  @ApiOperation({ summary: 'List published roleplay scenarios available to the current learner' })
  availableScenarios(
    @Request() req: AuthenticatedRequest,
    @Query() query: RoleplayScenarioQueryDto,
  ) {
    return this.scenarioService.getAvailable(getScopedTenantId(req), req.user, query);
  }

  @Get('scenarios/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Get a roleplay scenario' })
  getScenario(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.scenarioService.get(getScopedTenantId(req), id);
  }

  @Patch('scenarios/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update a roleplay scenario' })
  updateScenario(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleplayScenarioDto,
  ) {
    return this.scenarioService.update(getScopedTenantId(req), id, dto);
  }

  @Delete('scenarios/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Delete a roleplay scenario' })
  deleteScenario(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.scenarioService.softDelete(getScopedTenantId(req), id);
  }

  @Post('scenarios/:id/publish')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Publish a roleplay scenario' })
  publishScenario(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.scenarioService.setPublished(getScopedTenantId(req), id, true);
  }

  @Post('scenarios/:id/unpublish')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Unpublish a roleplay scenario' })
  unpublishScenario(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.scenarioService.setPublished(getScopedTenantId(req), id, false);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new roleplay session' })
  createSession(@Request() req: AuthenticatedRequest, @Body() dto: CreateRoleplaySessionDto) {
    return this.roleplayService.createSession(getScopedTenantId(req), req.user, dto);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all roleplay sessions for the user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getSessions(
    @Request() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;
    return this.roleplayService.getSessions(
      getScopedTenantId(req),
      req.user.id,
      pageNumber,
      limitNumber,
    );
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a specific roleplay session' })
  getSession(@Request() req: AuthenticatedRequest, @Param('id', ParseUUIDPipe) sessionId: string) {
    return this.roleplayService.getSession(getScopedTenantId(req), req.user.id, sessionId);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a text message in a roleplay session' })
  sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.roleplayService.sendMessage(
      getScopedTenantId(req),
      req.user.id,
      sessionId,
      dto.content,
    );
  }

  @Post('sessions/:id/messages/audio')
  @ApiOperation({ summary: 'Send an audio message and create pronunciation assessment' })
  sendAudioMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) sessionId: string,
    @Body() dto: CreateRoleplayAudioMessageDto,
  ) {
    return this.roleplayService.sendAudioMessage(
      getScopedTenantId(req),
      req.user.id,
      sessionId,
      dto,
    );
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Complete and evaluate a roleplay session' })
  completeSession(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.roleplayService.completeSession(getScopedTenantId(req), req.user.id, sessionId);
  }

  @Get('sessions/:id/pronunciation')
  @ApiOperation({ summary: 'Get pronunciation assessments for a session' })
  getPronunciation(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) sessionId: string,
  ) {
    return this.roleplayService.getPronunciationAssessments(
      getScopedTenantId(req),
      req.user.id,
      sessionId,
    );
  }
}
