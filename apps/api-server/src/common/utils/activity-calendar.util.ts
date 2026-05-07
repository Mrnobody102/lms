import { LearningActivityType } from '@repo/database';

export interface ActivityCalendarEntry {
  date: string;
  sessions: number;
  completedLessons: number;
  timeSpentSeconds: number;
}

type ActivityLike = {
  occurredAt: Date;
  type: LearningActivityType | string;
  timeSpentSeconds?: number | null;
};

export function buildActivityCalendar(
  activities: ActivityLike[],
  days = 7,
): ActivityCalendarEntry[] {
  const buckets = new Map<
    string,
    {
      sessions: number;
      completedLessons: number;
      timeSpentSeconds: number;
    }
  >();

  for (const activity of activities) {
    const key = activity.occurredAt.toISOString().slice(0, 10);
    const current = buckets.get(key) ?? {
      sessions: 0,
      completedLessons: 0,
      timeSpentSeconds: 0,
    };

    if (activity.type === LearningActivityType.LESSON_OPENED) {
      current.sessions += 1;
    }

    if (activity.type === LearningActivityType.LESSON_COMPLETED) {
      current.completedLessons += 1;
    }

    current.timeSpentSeconds += activity.timeSpentSeconds ?? 0;
    buckets.set(key, current);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const entries: ActivityCalendarEntry[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - offset);
    const key = day.toISOString().slice(0, 10);
    const bucket = buckets.get(key) ?? {
      sessions: 0,
      completedLessons: 0,
      timeSpentSeconds: 0,
    };

    entries.push({
      date: key,
      sessions: bucket.sessions,
      completedLessons: bucket.completedLessons,
      timeSpentSeconds: bucket.timeSpentSeconds,
    });
  }

  return entries;
}
