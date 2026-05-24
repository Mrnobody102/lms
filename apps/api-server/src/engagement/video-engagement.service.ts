import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, VideoEngagementEventType } from '@repo/database';
import { LearningAccessService } from '../common/services/learning-access.service';
import { PrismaService } from '../common/services/prisma.service';
import { TrackVideoEngagementEventDto } from './dto/track-video-engagement-event.dto';
import { VideoHeatmapQueryDto } from './dto/video-heatmap-query.dto';

interface EngagementUser {
  id: string;
  role: Role;
}

interface HeatmapBucket {
  startSecond: number;
  endSecond: number;
  watchSeconds: number;
  uniqueViewers: number;
  seekCount: number;
  dropOffCount: number;
  completionCount: number;
}

@Injectable()
export class VideoEngagementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly learningAccess: LearningAccessService,
  ) {}

  async trackLessonEvent(
    tenantId: string,
    user: EngagementUser,
    lessonId: string,
    dto: TrackVideoEngagementEventDto,
  ) {
    this.validateEvent(dto);

    const lesson = await this.prisma.lesson.findFirst({
      where: this.learningAccess.lessonWhere(tenantId, user, lessonId),
      select: { id: true, courseId: true, tenantId: true },
    });

    if (!lesson) {
      throw new NotFoundException('Video lesson not found in this tenant');
    }

    return this.prisma.videoEngagementEvent.create({
      data: {
        tenantId,
        userId: user.id,
        sourceTenantId: lesson.tenantId,
        courseId: lesson.courseId,
        lessonId: lesson.id,
        mediaAssetId: dto.mediaAssetId,
        eventType: dto.eventType,
        positionSeconds: dto.positionSeconds,
        durationSeconds: dto.durationSeconds,
        segmentStartSeconds: dto.segmentStartSeconds,
        segmentEndSeconds: dto.segmentEndSeconds,
        playbackRate: dto.playbackRate,
        metadata: this.toJsonInput(dto.metadata),
      },
    });
  }

  async getLessonHeatmap(ownerTenantId: string, lessonId: string, query: VideoHeatmapQueryDto) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, tenantId: ownerTenantId, deletedAt: null },
      select: { id: true, title: true, duration: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found in this tenant');
    }

    const events = await this.prisma.videoEngagementEvent.findMany({
      where: {
        sourceTenantId: ownerTenantId,
        lessonId,
        mediaAssetId: query.mediaAssetId,
      },
      orderBy: { occurredAt: 'asc' },
      select: {
        tenantId: true,
        userId: true,
        eventType: true,
        positionSeconds: true,
        durationSeconds: true,
        segmentStartSeconds: true,
        segmentEndSeconds: true,
      },
    });

    const bucketSeconds = query.bucketSeconds ?? 10;
    const maxSecond = Math.max(
      lesson.duration * 60,
      ...events.map((event) =>
        Math.max(event.positionSeconds, event.durationSeconds ?? 0, event.segmentEndSeconds ?? 0),
      ),
      bucketSeconds,
    );
    const bucketCount = Math.max(1, Math.ceil(maxSecond / bucketSeconds));
    const buckets = Array.from({ length: bucketCount }, (_, index) => ({
      startSecond: index * bucketSeconds,
      endSecond: (index + 1) * bucketSeconds,
      watchSeconds: 0,
      uniqueViewers: 0,
      seekCount: 0,
      dropOffCount: 0,
      completionCount: 0,
    }));
    const viewersByBucket = new Map<number, Set<string>>();
    const allViewers = new Set<string>();

    for (const event of events) {
      const viewerKey = `${event.tenantId}:${event.userId}`;
      allViewers.add(viewerKey);

      if (
        event.eventType === VideoEngagementEventType.WATCH_SEGMENT &&
        event.segmentStartSeconds !== null &&
        event.segmentEndSeconds !== null
      ) {
        this.addSegmentToBuckets(
          buckets,
          viewersByBucket,
          viewerKey,
          event.segmentStartSeconds,
          event.segmentEndSeconds,
        );
        continue;
      }

      const bucketIndex = this.bucketIndex(event.positionSeconds, bucketSeconds, buckets.length);
      this.addViewer(viewersByBucket, bucketIndex, viewerKey);

      if (event.eventType === VideoEngagementEventType.SEEK) {
        buckets[bucketIndex].seekCount += 1;
      }
      if (
        event.eventType === VideoEngagementEventType.PAUSE ||
        event.eventType === VideoEngagementEventType.ABANDONED
      ) {
        buckets[bucketIndex].dropOffCount += 1;
      }
      if (event.eventType === VideoEngagementEventType.COMPLETED) {
        buckets[bucketIndex].completionCount += 1;
      }
    }

    const normalizedBuckets: HeatmapBucket[] = buckets.map((bucket, index) => ({
      ...bucket,
      watchSeconds: Math.round(bucket.watchSeconds),
      uniqueViewers: viewersByBucket.get(index)?.size ?? 0,
    }));

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        estimatedDurationSeconds: lesson.duration * 60,
      },
      bucketSeconds,
      totalEvents: events.length,
      totalViewers: allViewers.size,
      buckets: normalizedBuckets,
    };
  }

  private addSegmentToBuckets(
    buckets: Array<Omit<HeatmapBucket, 'uniqueViewers'> & { uniqueViewers: number }>,
    viewersByBucket: Map<number, Set<string>>,
    viewerKey: string,
    segmentStartSeconds: number,
    segmentEndSeconds: number,
  ) {
    const start = Math.min(segmentStartSeconds, segmentEndSeconds);
    const end = Math.max(segmentStartSeconds, segmentEndSeconds);
    if (end <= start) {
      return;
    }

    const bucketSeconds = buckets[0].endSecond - buckets[0].startSecond;
    const startIndex = this.bucketIndex(start, bucketSeconds, buckets.length);
    const endIndex = this.bucketIndex(Math.max(start, end - 1), bucketSeconds, buckets.length);

    for (let index = startIndex; index <= endIndex; index += 1) {
      const bucket = buckets[index];
      const overlapStart = Math.max(start, bucket.startSecond);
      const overlapEnd = Math.min(end, bucket.endSecond);
      if (overlapEnd > overlapStart) {
        bucket.watchSeconds += overlapEnd - overlapStart;
        this.addViewer(viewersByBucket, index, viewerKey);
      }
    }
  }

  private bucketIndex(positionSeconds: number, bucketSeconds: number, bucketCount: number) {
    return Math.min(Math.max(Math.floor(positionSeconds / bucketSeconds), 0), bucketCount - 1);
  }

  private addViewer(map: Map<number, Set<string>>, bucketIndex: number, viewerKey: string) {
    const viewers = map.get(bucketIndex) ?? new Set<string>();
    viewers.add(viewerKey);
    map.set(bucketIndex, viewers);
  }

  private validateEvent(dto: TrackVideoEngagementEventDto) {
    if (
      dto.eventType === VideoEngagementEventType.WATCH_SEGMENT &&
      (dto.segmentStartSeconds === undefined || dto.segmentEndSeconds === undefined)
    ) {
      throw new BadRequestException(
        'WATCH_SEGMENT requires segmentStartSeconds and segmentEndSeconds',
      );
    }

    if (
      dto.segmentStartSeconds !== undefined &&
      dto.segmentEndSeconds !== undefined &&
      dto.segmentEndSeconds < dto.segmentStartSeconds
    ) {
      throw new BadRequestException(
        'segmentEndSeconds must be greater than or equal to segmentStartSeconds',
      );
    }
  }

  private toJsonInput(value: Record<string, unknown> | undefined) {
    return value === undefined ? undefined : (value as Prisma.InputJsonValue);
  }
}
