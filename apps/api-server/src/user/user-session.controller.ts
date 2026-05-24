import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { IpAddress } from '../auth/decorators/ip-address.decorator';
import { UserAgent } from '../auth/decorators/user-agent.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogService, AuditAction, AuditStatus } from '../common/services/audit-log.service';
import { UAParser } from 'ua-parser-js';
import { AuthService } from '../auth/auth.service';
import type { Request } from 'express';

@ApiTags('User Sessions')
@ApiBearerAuth()
@Controller('user-sessions')
@UseGuards(JwtAuthGuard)
export class UserSessionController {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private authService: AuthService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get active sessions for current user' })
  @ApiResponse({ status: 200, description: 'Sessions retrieved successfully' })
  async getSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @Query('page') pageValue?: string,
    @Query('limit') limitValue?: string,
  ) {
    const page = this.parsePositiveInt(pageValue, 1, 1, 1000);
    const limit = this.parsePositiveInt(limitValue, 10, 1, 50);
    const where = {
      userId: user.id,
      tenantId: user.tenantId,
      expiresAt: { gt: new Date() },
      revokedAt: null,
    };

    const [sessions, total] = await this.prisma.$transaction([
      this.prisma.refreshToken.findMany({
        where,
        select: {
          id: true,
          tokenHash: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refreshToken.count({
        where,
      }),
    ]);

    const currentToken = req.cookies['refresh_token'];
    const currentHash = currentToken ? await this.authService.hashToken(currentToken) : null;

    const data = sessions.map((session) => {
      const parser = new UAParser(session.userAgent || '');
      const device = parser.getDevice();
      const os = parser.getOS();
      const browser = parser.getBrowser();

      return {
        id: session.id,
        ipAddress: session.ipAddress,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
        updatedAt: session.updatedAt,
        device: {
          vendor: device.vendor || 'Unknown',
          model: device.model || 'Unknown',
          type: device.type || 'desktop',
        },
        os: {
          name: os.name || 'Unknown',
          version: os.version || '',
        },
        browser: {
          name: browser.name || 'Unknown',
          version: browser.version || '',
        },
        isCurrent: session.tokenHash === currentHash,
      };
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Delete('revoke-others')
  @ApiOperation({ summary: 'Revoke all other sessions' })
  @ApiResponse({ status: 200, description: 'Other sessions revoked successfully' })
  async revokeOthers(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: Request,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const currentToken = req.cookies['refresh_token'];
    const currentHash = currentToken ? await this.authService.hashToken(currentToken) : null;

    if (!currentHash) {
      throw new UnauthorizedException('Current session not found');
    }

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
        tenantId: user.tenantId,
        tokenHash: { not: currentHash },
      },
    });

    await this.auditLog.log({
      userId: user.id,
      tenantId: user.tenantId,
      action: AuditAction.SESSION_REVOKE,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: { count: result.count, type: 'others' },
    });

    return { count: result.count };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, description: 'Session revoked successfully' })
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
    @IpAddress() ipAddress: string,
    @UserAgent() userAgent: string,
  ) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId: user.id, tenantId: user.tenantId },
    });

    if (!session) {
      throw new UnauthorizedException('Session not found or unauthorized');
    }

    await this.prisma.refreshToken.deleteMany({
      where: { id: sessionId, userId: user.id, tenantId: user.tenantId },
    });

    await this.auditLog.log({
      userId: user.id,
      tenantId: user.tenantId,
      action: AuditAction.SESSION_REVOKE,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: { sessionId },
    });

    return {};
  }

  private parsePositiveInt(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const parsed = value ? Number.parseInt(value, 10) : fallback;
    if (!Number.isFinite(parsed)) {
      return fallback;
    }

    return Math.min(Math.max(parsed, min), max);
  }
}
