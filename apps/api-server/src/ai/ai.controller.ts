import {
  Controller,
  Post,
  Param,
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
        attemptId_questionId: {
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

    if (!answer || answer.tenantId !== tenantId) {
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
      where: { id: answer.id },
      data: { aiFeedback: explanation },
    });

    return { success: true, explanation };
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
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      include: {
        attempt: true,
        question: true,
      },
    });

    if (!answer || answer.tenantId !== tenantId) {
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
      where: { id: answer.id },
      data: { aiFeedback: explanation },
    });

    return { success: true, explanation };
  }
}
