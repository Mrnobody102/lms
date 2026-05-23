import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

const EWMA_ALPHA = 0.7;
const DEFAULT_TREND_DAYS = 30;
const MAX_TREND_DAYS = 90;

export interface AnswerEvent {
  skillCodes: string[];
  isCorrect: boolean;
}

export interface StudentMasteryTrendSkill {
  code: string;
  name: string;
  nameVi: string | null;
  color: string | null;
}

export type StudentMasteryTrendDay = { date: string } & Record<string, string | number>;

export interface StudentMasteryTrend {
  days: number;
  skills: StudentMasteryTrendSkill[];
  trend: StudentMasteryTrendDay[];
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

  async getStudentMasteryTrend(
    tenantId: string,
    userId: string,
    daysInput = DEFAULT_TREND_DAYS,
  ): Promise<StudentMasteryTrend> {
    const { days, startDate } = getTrendWindow(daysInput);

    const records = await this.prisma.skillMasterySnapshot.findMany({
      where: {
        tenantId,
        userId,
        date: { gte: startDate },
      },
      select: {
        skillCode: true,
        mastery: true,
        date: true,
        skill: {
          select: {
            code: true,
            name: true,
            nameVi: true,
            color: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { skillCode: 'asc' }],
    });

    const trendMap = new Map<string, StudentMasteryTrendDay>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setUTCDate(d.getUTCDate() + i);
      const date = d.toISOString().split('T')[0];
      trendMap.set(date, { date });
    }

    const skills = new Map<string, StudentMasteryTrendSkill>();

    for (const record of records) {
      const date = record.date.toISOString().split('T')[0];
      const bucket = trendMap.get(date);
      if (!bucket) continue;

      bucket[record.skillCode] = Math.round(clamp01(record.mastery) * 100);
      if (record.skill) {
        skills.set(record.skillCode, {
          code: record.skill.code,
          name: record.skill.name,
          nameVi: record.skill.nameVi,
          color: record.skill.color,
        });
      } else if (!skills.has(record.skillCode)) {
        skills.set(record.skillCode, {
          code: record.skillCode,
          name: record.skillCode,
          nameVi: null,
          color: null,
        });
      }
    }

    return {
      days,
      skills: Array.from(skills.values()).sort((a, b) => a.code.localeCompare(b.code)),
      trend: Array.from(trendMap.values()),
    };
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

function getTrendWindow(daysInput: number) {
  const days = Math.min(Math.max(Math.floor(daysInput), 1), MAX_TREND_DAYS);
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  return { days, startDate };
}
