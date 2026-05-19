import { useMutation } from '@tanstack/react-query';
import { explainPracticeAnswer, explainExamAnswer, AiExplainResponse } from '../lib/ai-api';

export function useExplainPracticeAnswer() {
  return useMutation<AiExplainResponse, Error, { attemptId: string; questionId: string }>({
    mutationFn: ({ attemptId, questionId }) => explainPracticeAnswer(attemptId, questionId),
  });
}

export function useExplainExamAnswer() {
  return useMutation<AiExplainResponse, Error, { attemptId: string; questionId: string }>({
    mutationFn: ({ attemptId, questionId }) => explainExamAnswer(attemptId, questionId),
  });
}
