import api from './api';

export interface AiExplainResponse {
  explanation: string;
}

export async function explainPracticeAnswer(
  attemptId: string,
  questionId: string,
): Promise<AiExplainResponse> {
  const response = await api.post(`/ai/explain/practice/${attemptId}/${questionId}`);
  return response.data;
}

export async function explainExamAnswer(
  attemptId: string,
  questionId: string,
): Promise<AiExplainResponse> {
  const response = await api.post(`/ai/explain/exam/${attemptId}/${questionId}`);
  return response.data;
}
