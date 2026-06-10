export const AI_PROMPT_VERSIONS = {
  dailyQuest: 'daily-quest-v1',
  flashcardBulk: 'flashcard-bulk-v1',
  flashcardGenerate: 'flashcard-generate-v1',
  practiceEvaluate: 'practice-evaluate-v1',
  practiceGenerate: 'practice-ai-v1',
  roleplayChat: 'roleplay-chat-v1',
  roleplayEvaluate: 'roleplay-evaluate-v1',
  tutorChat: 'tutor-chat-v1',
  tutorExplain: 'tutor-explain-v1',
} as const;

export const AI_FEATURE_KEYS = {
  dailyQuest: 'daily_quest',
  flashcardBulk: 'flashcard.bulk',
  flashcardGenerate: 'flashcard.generate',
  practiceEvaluate: 'practice.evaluate',
  practiceGenerate: 'practice.generate',
  roleplayChat: 'roleplay.chat',
  roleplayEvaluate: 'roleplay.evaluate',
  tutorChat: 'tutor.chat',
  tutorExplain: 'tutor.explain',
} as const;

export type AiFeatureKey = (typeof AI_FEATURE_KEYS)[keyof typeof AI_FEATURE_KEYS];
