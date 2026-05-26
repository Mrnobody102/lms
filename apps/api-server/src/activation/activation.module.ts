import { Module } from '@nestjs/common';
import { ActivationService } from './activation.service';
import { ActivationController } from './activation.controller';
import { PrismaService } from '../common/services/prisma.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [NotificationModule],
  controllers: [ActivationController],
  providers: [ActivationService, PrismaService],
  exports: [ActivationService],
})
export class ActivationModule {}
