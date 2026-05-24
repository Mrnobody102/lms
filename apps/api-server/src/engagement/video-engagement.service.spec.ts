import { describe, expect, it, vi } from 'vitest';
import { Role, VideoEngagementEventType } from '@repo/database';
import { VideoEngagementService } from './video-engagement.service';

describe('VideoEngagementService', () => {
  it('tracks video engagement with tenant-scoped lesson access', async () => {
    const prisma = {
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'lesson-1',
          courseId: 'course-1',
          tenantId: 'tenant-1',
        }),
      },
      videoEngagementEvent: {
        create: vi.fn().mockResolvedValue({ id: 'event-1' }),
      },
    };
    const learningAccess = {
      lessonWhere: vi.fn().mockReturnValue({ tenantId: 'tenant-1', id: 'lesson-1' }),
    };
    const service = new VideoEngagementService(prisma as never, learningAccess as never);

    await service.trackLessonEvent('tenant-1', { id: 'user-1', role: Role.STUDENT }, 'lesson-1', {
      eventType: VideoEngagementEventType.WATCH_SEGMENT,
      positionSeconds: 30,
      segmentStartSeconds: 10,
      segmentEndSeconds: 30,
    });

    expect(learningAccess.lessonWhere).toHaveBeenCalledWith(
      'tenant-1',
      { id: 'user-1', role: Role.STUDENT },
      'lesson-1',
    );
    expect(prisma.videoEngagementEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tenantId: 'tenant-1',
          userId: 'user-1',
          sourceTenantId: 'tenant-1',
          courseId: 'course-1',
          lessonId: 'lesson-1',
        }),
      }),
    );
  });

  it('aggregates watch, seek, and drop-off events into heatmap buckets', async () => {
    const prisma = {
      lesson: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'lesson-1',
          title: 'Video lesson',
          duration: 1,
        }),
      },
      videoEngagementEvent: {
        findMany: vi.fn().mockResolvedValue([
          {
            tenantId: 'tenant-1',
            userId: 'user-1',
            eventType: VideoEngagementEventType.WATCH_SEGMENT,
            positionSeconds: 20,
            durationSeconds: 60,
            segmentStartSeconds: 0,
            segmentEndSeconds: 20,
          },
          {
            tenantId: 'tenant-1',
            userId: 'user-1',
            eventType: VideoEngagementEventType.SEEK,
            positionSeconds: 12,
            durationSeconds: 60,
            segmentStartSeconds: null,
            segmentEndSeconds: null,
          },
          {
            tenantId: 'tenant-1',
            userId: 'user-2',
            eventType: VideoEngagementEventType.ABANDONED,
            positionSeconds: 18,
            durationSeconds: 60,
            segmentStartSeconds: null,
            segmentEndSeconds: null,
          },
        ]),
      },
    };
    const service = new VideoEngagementService(prisma as never, {} as never);

    const result = await service.getLessonHeatmap('tenant-1', 'lesson-1', { bucketSeconds: 10 });

    expect(result.totalEvents).toBe(3);
    expect(result.totalViewers).toBe(2);
    expect(result.buckets[0]).toEqual(
      expect.objectContaining({ startSecond: 0, watchSeconds: 10, uniqueViewers: 1 }),
    );
    expect(result.buckets[1]).toEqual(
      expect.objectContaining({
        startSecond: 10,
        watchSeconds: 10,
        uniqueViewers: 2,
        seekCount: 1,
        dropOffCount: 1,
      }),
    );
  });
});
