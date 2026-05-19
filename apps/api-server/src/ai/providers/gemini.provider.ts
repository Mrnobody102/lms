import { Injectable, Logger } from '@nestjs/common';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { IAiProvider, GenerateExplanationOptions } from '../interfaces/ai-provider.interface';

@Injectable()
export class GeminiProvider implements IAiProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  async generateExplanation(options: GenerateExplanationOptions): Promise<string> {
    try {
      const { questionPrompt, correctAnswer, userAnswer, skillTags, context } = options;

      const systemPrompt = `You are a friendly, encouraging, and highly effective AI tutor.
Your goal is to explain to the student why their answer is incorrect, based on the provided correct answer.
Keep your explanation concise (1-3 short paragraphs), easy to understand, and focused on the specific mistake.
Do not give away the answer directly if it's a practice, just explain the concept (though in this case the student already knows the correct answer, so explain why the correct answer is right and their answer is wrong).
Use Markdown for formatting (bolding key terms).
Language: Vietnamese (unless the context strictly requires otherwise).

Context: ${context || 'None'}
Skills tested: ${skillTags?.join(', ') || 'General'}`;

      const userPrompt = `Question:
${questionPrompt}

Correct Answer:
${JSON.stringify(correctAnswer)}

Student's Incorrect Answer:
${JSON.stringify(userAnswer)}

Please explain why the student's answer is incorrect and clarify the concept.`;

      // Use a fast model like gemini-2.5-flash if available, or gemini-1.5-flash
      const { text } = await generateText({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.3,
      });

      return text;
    } catch (error) {
      this.logger.error('Error generating explanation from Gemini', error);
      throw new Error('Failed to generate explanation from AI provider.');
    }
  }
}
