import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@repo/database';

export enum AuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET_REQUEST = 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET_SUCCESS = 'PASSWORD_RESET_SUCCESS',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SESSION_REVOKE = 'SESSION_REVOKE',
  REGISTER = 'REGISTER',
}

export enum AuditStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

interface LogOptions {
  userId: string;
  tenantId: string;
  action: AuditAction;
  status: AuditStatus;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(options: LogOptions) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId: options.userId,
          tenantId: options.tenantId,
          action: options.action,
          status: options.status,
          ipAddress: options.ipAddress,
          userAgent: options.userAgent,
          metadata: (options.metadata || {}) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // We don't want audit logging to crash the main request
      console.error('Failed to create audit log:', error);
    }
  }
}
