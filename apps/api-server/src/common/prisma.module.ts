import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';
import { LearningAccessService } from './services/learning-access.service';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  providers: [PrismaService, LearningAccessService, AuditLogService],
  exports: [PrismaService, LearningAccessService, AuditLogService],
})
export class PrismaModule {}
