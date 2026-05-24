import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AudioProcessor } from './audio.processor';
import { PronunciationProcessor } from './pronunciation.processor';
import { ReportingProcessor } from './reporting.processor';
import { AdminReportsModule } from '../admin-reports/admin-reports.module';
import { RoleplayModule } from '../roleplay/roleplay.module';

@Module({
  imports: [
    AdminReportsModule,
    RoleplayModule,
    BullModule.registerQueue({
      name: 'media-processing',
    }),
    BullModule.registerQueue({
      name: 'pronunciation-assessment',
    }),
    BullModule.registerQueue({
      name: 'reporting',
    }),
  ],
  providers: [AudioProcessor, PronunciationProcessor, ReportingProcessor],
  exports: [BullModule],
})
export class JobsModule {}
