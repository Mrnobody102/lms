import { Global, Module } from '@nestjs/common';
import { LearningAccessService } from './services/learning-access.service';
import { PrismaService } from './services/prisma.service';

@Global()
@Module({
  providers: [PrismaService, LearningAccessService],
  exports: [PrismaService, LearningAccessService],
})
export class PrismaModule {}
