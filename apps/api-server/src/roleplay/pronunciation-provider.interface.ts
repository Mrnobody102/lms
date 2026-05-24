export interface PronunciationAssessmentInput {
  mediaAssetId: string;
  mediaUrl: string | null;
  expectedText?: string;
  targetLanguage: string;
}

export interface PronunciationAssessmentResult {
  status: 'COMPLETED' | 'FAILED';
  transcript?: string;
  overallScore?: number;
  fluencyScore?: number;
  accuracyScore?: number;
  completenessScore?: number;
  wordScores?: unknown;
  provider?: string;
  rawProviderPayload?: unknown;
  errorMessage?: string;
}

export abstract class PronunciationAssessmentProvider {
  abstract assess(input: PronunciationAssessmentInput): Promise<PronunciationAssessmentResult>;
}
