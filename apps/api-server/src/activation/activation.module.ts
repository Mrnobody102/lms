import { Module } from '@nestjs/common';
import { ActivationService } from './activation.service';
import { ActivationController } from './activation.controller';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [ActivationController],
  providers: [ActivationService, PrismaService],
  exports: [ActivationService],
})
export class ActivationModule {}
