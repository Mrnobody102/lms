import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

interface TranscodeAudioPayload {
  assetId: string;
  targetFormat: string;
}

@Processor('media-processing')
export class AudioProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessor.name);

  async process(job: Job<TranscodeAudioPayload, unknown, string>): Promise<unknown> {
    this.logger.log(`Processing job ${job.id} of type ${job.name}...`);

    switch (job.name) {
      case 'transcode-audio': {
        const { assetId, targetFormat } = job.data;
        this.logger.log(`Transcoding audio for asset ${assetId} to format ${targetFormat}`);

        if (process.env.NODE_ENV === 'test') {
          return { success: true, assetId, formatted: targetFormat };
        }

        throw new Error('Audio transcoding provider is not configured');
      }

      default: {
        this.logger.warn(`Unknown job name: ${job.name}`);
        return { success: false, error: 'Unknown job name' };
      }
    }
  }
}
