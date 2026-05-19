import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AudioProcessor } from './audio.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'media-processing',
    }),
  ],
  providers: [AudioProcessor],
  exports: [BullModule],
})
export class JobsModule {}
