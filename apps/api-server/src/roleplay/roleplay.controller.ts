import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoleplayService } from './roleplay.service';
import { CreateRoleplaySessionDto } from './dto/create-roleplay-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';

@ApiTags('Roleplay')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roleplay')
export class RoleplayController {
  constructor(private readonly roleplayService: RoleplayService) {}

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new roleplay session' })
  async createSession(@Request() req: AuthenticatedRequest, @Body() dto: CreateRoleplaySessionDto) {
    return this.roleplayService.createSession(getScopedTenantId(req), req.user.id, dto.scenario);
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all roleplay sessions for the user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getSessions(
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
  async getSession(@Request() req: AuthenticatedRequest, @Param('id') sessionId: string) {
    return this.roleplayService.getSession(getScopedTenantId(req), req.user.id, sessionId);
  }

  @Post('sessions/:id/messages')
  @ApiOperation({ summary: 'Send a message in a roleplay session' })
  async sendMessage(
    @Request() req: AuthenticatedRequest,
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.roleplayService.sendMessage(
      getScopedTenantId(req),
      req.user.id,
      sessionId,
      dto.content,
    );
  }

  @Post('sessions/:id/complete')
  @ApiOperation({ summary: 'Complete and evaluate a roleplay session' })
  async completeSession(@Request() req: AuthenticatedRequest, @Param('id') sessionId: string) {
    return this.roleplayService.completeSession(getScopedTenantId(req), req.user.id, sessionId);
  }
}
