import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LearningActivityType } from '@repo/database';
import { buildActivityCalendar } from './activity-calendar.util';

describe('buildActivityCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-08T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds a zero-filled rolling window and aggregates activity by UTC day', () => {
    const calendar = buildActivityCalendar(
      [
        {
          occurredAt: new Date('2026-05-07T08:00:00.000Z'),
          type: LearningActivityType.LESSON_OPENED,
          timeSpentSeconds: 120,
        },
        {
          occurredAt: new Date('2026-05-08T08:00:00.000Z'),
          type: LearningActivityType.LESSON_OPENED,
          timeSpentSeconds: 300,
        },
        {
          occurredAt: new Date('2026-05-08T09:00:00.000Z'),
          type: LearningActivityType.LESSON_COMPLETED,
          timeSpentSeconds: null,
        },
        {
          occurredAt: new Date('2026-05-01T09:00:00.000Z'),
          type: LearningActivityType.LESSON_OPENED,
          timeSpentSeconds: 999,
        },
      ],
      3,
    );

    expect(calendar).toEqual([
      {
        date: '2026-05-06',
        sessions: 0,
        completedLessons: 0,
        timeSpentSeconds: 0,
      },
      {
        date: '2026-05-07',
        sessions: 1,
        completedLessons: 0,
        timeSpentSeconds: 120,
      },
      {
        date: '2026-05-08',
        sessions: 1,
        completedLessons: 1,
        timeSpentSeconds: 300,
      },
    ]);
  });
});
