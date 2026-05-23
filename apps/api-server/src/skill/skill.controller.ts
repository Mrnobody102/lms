import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@repo/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IpAddress } from '../auth/decorators/ip-address.decorator';
import { UserAgent } from '../auth/decorators/user-agent.decorator';
import { AuditAction, AuditLogService, AuditStatus } from '../common/services/audit-log.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillMasteryService } from './skill-mastery.service';
import { SkillService } from './skill.service';

@ApiBearerAuth()
@ApiTags('skills')
@Controller('skills')
export class SkillController {
  constructor(
    private readonly skillService: SkillService,
    private readonly skillMastery: SkillMasteryService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List skills for current tenant' })
  async list(
    @Request() req: AuthenticatedRequest,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const tenantId = getScopedTenantId(req);
    const showInactive =
      req.user.role === Role.ADMIN || req.user.role === Role.SUPER_ADMIN
        ? includeInactive === 'true'
        : false;
    return this.skillService.list(tenantId, { includeInactive: showInactive });
  }

  @Get('mastery')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user skill mastery snapshot' })
  async getMastery(@Request() req: AuthenticatedRequest) {
    return this.skillMastery.getStudentMastery(req.user.tenantId, req.user.id);
  }

  @Get('mastery-trend')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user skill mastery trend' })
  async getMasteryTrend(
    @Request() req: AuthenticatedRequest,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.skillMastery.getStudentMasteryTrend(req.user.tenantId, req.user.id, days);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new skill in current tenant' })
  async create(
    @Body() dto: CreateSkillDto,
    @Request() req: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const tenantId = getScopedTenantId(req);
    const skill = await this.skillService.create(tenantId, dto);
    await this.auditLog.log({
      userId: req.user.id,
      tenantId,
      action: AuditAction.SKILL_CREATE,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: { skillId: skill.id, code: skill.code, name: skill.name },
    });
    return skill;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a skill' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
    @Request() req: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const tenantId = getScopedTenantId(req);
    const skill = await this.skillService.update(tenantId, id, dto);
    await this.auditLog.log({
      userId: req.user.id,
      tenantId,
      action: AuditAction.SKILL_UPDATE,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: { skillId: skill.id, code: skill.code, changes: dto },
    });
    return skill;
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Soft-delete a skill' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthenticatedRequest,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const tenantId = getScopedTenantId(req);
    const skill = await this.skillService.softDelete(tenantId, id);
    await this.auditLog.log({
      userId: req.user.id,
      tenantId,
      action: AuditAction.SKILL_DELETE,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: { skillId: skill.id, code: skill.code },
    });
    return skill;
  }
}
