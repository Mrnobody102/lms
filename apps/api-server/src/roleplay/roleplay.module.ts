import { Module } from '@nestjs/common';
import { RoleplayController } from './roleplay.controller';
import { RoleplayService } from './roleplay.service';
import { PrismaModule } from '../common/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [RoleplayController],
  providers: [RoleplayService],
  exports: [RoleplayService],
})
export class RoleplayModule {}
