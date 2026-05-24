import { Injectable } from '@nestjs/common';
import {
  PronunciationAssessmentInput,
  PronunciationAssessmentProvider,
  PronunciationAssessmentResult,
} from './pronunciation-provider.interface';

@Injectable()
export class DefaultPronunciationAssessmentProvider extends PronunciationAssessmentProvider {
  async assess(input: PronunciationAssessmentInput): Promise<PronunciationAssessmentResult> {
    if (process.env.NODE_ENV === 'test') {
      return {
        status: 'COMPLETED',
        transcript: input.expectedText ?? '',
        overallScore: 80,
        fluencyScore: 80,
        accuracyScore: 80,
        completenessScore: 80,
        provider: 'deterministic-test',
        rawProviderPayload: { testMode: true },
      };
    }

    return {
      status: 'FAILED',
      provider: 'unconfigured',
      errorMessage: 'Pronunciation assessment provider is not configured',
    };
  }
}
