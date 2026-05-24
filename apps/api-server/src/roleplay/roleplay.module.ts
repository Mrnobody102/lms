import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../common/prisma.module';
import { MediaModule } from '../media/media.module';
import { DefaultPronunciationAssessmentProvider } from './default-pronunciation.provider';
import { PronunciationAssessmentProvider } from './pronunciation-provider.interface';
import { PronunciationAssessmentService } from './pronunciation-assessment.service';
import { RoleplayController } from './roleplay.controller';
import { RoleplayScenarioService } from './roleplay-scenario.service';
import { RoleplayService } from './roleplay.service';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    MediaModule,
    BullModule.registerQueue({
      name: 'pronunciation-assessment',
    }),
  ],
  controllers: [RoleplayController],
  providers: [
    RoleplayService,
    RoleplayScenarioService,
    PronunciationAssessmentService,
    {
      provide: PronunciationAssessmentProvider,
      useClass: DefaultPronunciationAssessmentProvider,
    },
  ],
  exports: [RoleplayService, RoleplayScenarioService, PronunciationAssessmentService],
})
export class RoleplayModule {}
