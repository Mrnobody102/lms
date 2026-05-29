import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { getScopedTenantId } from '../common/utils/tenant-request.util';
import { PrismaService } from '../common/services/prisma.service';
import { SocraticChatDto } from './dto/socratic-chat.dto';
import { GenerateDailyQuestDto } from './dto/generate-daily-quest.dto';
import { GenerateFlashcardDto } from './dto/generate-flashcard.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('explain/practice/:attemptId/:questionId')
  async explainPracticeAnswer(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
  ) {
    const tenantId = getScopedTenantId(req);
    const userId = req.user.id;

    // 1. Verify attempt ownership and fetch data
    const answer = await this.prisma.practiceAnswer.findUnique({
      where: {
        tenantId_attemptId_questionId: {
          tenantId,
          attemptId,
          questionId,
        },
      },
      include: {
        attempt: true,
        question: {
          include: {
            unit: true,
          },
        },
      },
    });

    if (!answer) {
      throw new NotFoundException('Practice answer not found');
    }

    if (answer.attempt.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // 2. Extract info
    const questionPrompt = answer.question.prompt;
    const correctAnswer = answer.question.correctAnswer;
    const userAnswer = answer.answer;
    const skillTags = answer.question.skillTags;

    // Optional context from lesson content? For practice, we might not have a direct lesson easily,
    // but we can try to fetch it if needed, or omit it.
    const context = answer.question.explanation || answer.question.unit?.description || undefined;

    // 3. Call AI Service
    const explanation = await this.aiService.explainAnswer(
      tenantId,
      userId,
      questionPrompt,
      correctAnswer,
      userAnswer,
      skillTags,
      context,
    );

    // Optional: We can save this explanation in `aiFeedback` of `PracticeAnswer`
    await this.prisma.practiceAnswer.update({
      where: { id_tenantId: { id: answer.id, tenantId } },
      data: { aiFeedback: explanation },
    });

    return { explanation };
  }

  @Post('explain/exam/:attemptId/:questionId')
  async explainExamAnswer(
    @Req() req: AuthenticatedRequest,
    @Param('attemptId') attemptId: string,
    @Param('questionId') questionId: string,
  ) {
    const tenantId = getScopedTenantId(req);
    const userId = req.user.id;

    const answer = await this.prisma.examAnswer.findUnique({
      where: {
        tenantId_attemptId_questionId: {
          tenantId,
          attemptId,
          questionId,
        },
      },
      include: {
        attempt: true,
        question: true,
      },
    });

    if (!answer) {
      throw new NotFoundException('Exam answer not found');
    }

    if (answer.attempt.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Only allow explaining if attempt is submitted
    if (answer.attempt.status !== 'SUBMITTED') {
      throw new ForbiddenException('Cannot explain unsubmitted exam');
    }

    const questionPrompt = answer.question.prompt;
    const correctAnswer = answer.question.correctAnswer;
    const userAnswer = answer.answer;
    const skillTags = answer.question.skillTags;
    const context = answer.question.explanation || undefined;

    const explanation = await this.aiService.explainAnswer(
      tenantId,
      userId,
      questionPrompt,
      correctAnswer,
      userAnswer,
      skillTags,
      context,
    );

    await this.prisma.examAnswer.update({
      where: { id_tenantId: { id: answer.id, tenantId } },
      data: { aiFeedback: explanation },
    });

    return { explanation };
  }

  @Post('socratic-chat')
  async socraticChat(@Req() req: AuthenticatedRequest, @Body() dto: SocraticChatDto) {
    const tenantId = getScopedTenantId(req);
    const userId = req.user.id;

    const systemPrompt = `You are a Socratic AI tutor. The user is trying to solve this question:
Question: ${dto.questionPrompt}
${dto.correctAnswer ? `Correct Answer: ${JSON.stringify(dto.correctAnswer)}` : ''}
${dto.studentAnswer ? `Student's Answer: ${JSON.stringify(dto.studentAnswer)}` : ''}

Your task is to guide the user to the correct answer without ever revealing it directly.
Ask one guiding question at a time. Be concise, friendly, and encouraging.`;

    const aiReply = await this.aiService.chatRoleplay(tenantId, userId, dto.messages, systemPrompt);

    return { role: 'assistant', content: aiReply };
  }

  @Post('daily-quest')
  async generateDailyQuest(@Req() req: AuthenticatedRequest, @Body() _dto: GenerateDailyQuestDto) {
    const tenantId = getScopedTenantId(req);
    const userId = req.user.id;

    const questions = await this.aiService.generateDailyQuest(tenantId, userId);
    return { questions };
  }

  @Post('generate-flashcard')
  async generateFlashcard(@Req() req: AuthenticatedRequest, @Body() dto: GenerateFlashcardDto) {
    const tenantId = getScopedTenantId(req);
    const userId = req.user.id;

    const result = await this.aiService.generateFlashcard(tenantId, userId, dto.front, dto.context);
    return result;
  }
}
