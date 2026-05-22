import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

const EWMA_ALPHA = 0.7;

export interface AnswerEvent {
  skillCodes: string[];
  isCorrect: boolean;
}

interface SkillBatch {
  attempts: number;
  correctAttempts: number;
}

@Injectable()
export class SkillMasteryService {
  private readonly logger = new Logger(SkillMasteryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async applyAnswerEvents(tenantId: string, userId: string, events: AnswerEvent[]): Promise<void> {
    if (events.length === 0) return;

    const bySkill = new Map<string, SkillBatch>();
    for (const event of events) {
      const codes = this.normalizeCodes(event.skillCodes);
      for (const code of codes) {
        const batch = bySkill.get(code) ?? { attempts: 0, correctAttempts: 0 };
        batch.attempts += 1;
        if (event.isCorrect) batch.correctAttempts += 1;
        bySkill.set(code, batch);
      }
    }

    if (bySkill.size === 0) return;

    try {
      await Promise.all(
        Array.from(bySkill.entries()).map(([skillCode, batch]) =>
          this.applyBatchForSkill(tenantId, userId, skillCode, batch),
        ),
      );
    } catch (error) {
      this.logger.warn(
        `Failed to update skill mastery for user=${userId} tenant=${tenantId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getStudentMastery(tenantId: string, userId: string) {
    return this.prisma.skillMastery.findMany({
      where: { tenantId, userId },
      include: {
        skill: {
          select: {
            id: true,
            code: true,
            name: true,
            nameVi: true,
            color: true,
            description: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ mastery: 'asc' }, { skillCode: 'asc' }],
    });
  }

  private async applyBatchForSkill(
    tenantId: string,
    userId: string,
    skillCode: string,
    batch: SkillBatch,
  ) {
    const correctRatio = batch.correctAttempts / batch.attempts;

    const existing = await this.prisma.skillMastery.findUnique({
      where: {
        tenantId_userId_skillCode: { tenantId, userId, skillCode },
      },
      select: { id: true, mastery: true, attempts: true, correctAttempts: true },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (existing) {
      const newMastery = clamp01(EWMA_ALPHA * existing.mastery + (1 - EWMA_ALPHA) * correctRatio);

      await this.prisma.$transaction(async (tx) => {
        await tx.skillMastery.update({
          where: { id: existing.id },
          data: {
            mastery: newMastery,
            attempts: existing.attempts + batch.attempts,
            correctAttempts: existing.correctAttempts + batch.correctAttempts,
          },
        });

        await tx.skillMasterySnapshot.upsert({
          where: {
            tenantId_userId_skillCode_date: {
              tenantId,
              userId,
              skillCode,
              date: today,
            },
          },
          create: {
            tenantId,
            userId,
            skillCode,
            mastery: newMastery,
            date: today,
          },
          update: {
            mastery: newMastery,
          },
        });
      });
      return;
    }

    // First exposure: bootstrap mastery from this batch's correct ratio.
    const initialMastery = clamp01(correctRatio);
    await this.prisma.$transaction(async (tx) => {
      await tx.skillMastery.create({
        data: {
          tenantId,
          userId,
          skillCode,
          mastery: initialMastery,
          attempts: batch.attempts,
          correctAttempts: batch.correctAttempts,
        },
      });

      await tx.skillMasterySnapshot.create({
        data: {
          tenantId,
          userId,
          skillCode,
          mastery: initialMastery,
          date: today,
        },
      });
    });
  }

  private normalizeCodes(codes: string[]): string[] {
    const set = new Set<string>();
    for (const raw of codes) {
      const trimmed = raw?.trim();
      if (trimmed) set.add(trimmed);
    }
    return Array.from(set);
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
