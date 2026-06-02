import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification } from '@repo/database';
import { Observable, Subject } from 'rxjs';
import { PrismaService } from '../common/services/prisma.service';
import { BroadcastNotificationDto } from './dto/broadcast.dto';

export type NotificationStreamEvent =
  | {
      kind: 'notifications.snapshot';
      unreadCount: number;
    }
  | {
      kind: 'notification.created';
      notification: Notification;
      unreadCount: number;
    }
  | {
      kind: 'notifications.refresh';
      unreadCount?: number;
    };

@Injectable()
export class NotificationService {
  private readonly streams = new Map<string, Set<Subject<NotificationStreamEvent>>>();

  constructor(private readonly prisma: PrismaService) {}

  streamUserNotifications(tenantId: string, userId: string): Observable<NotificationStreamEvent> {
    return new Observable<NotificationStreamEvent>((subscriber) => {
      const subject = new Subject<NotificationStreamEvent>();
      const key = this.streamKey(tenantId, userId);
      const subjects = this.streams.get(key) ?? new Set<Subject<NotificationStreamEvent>>();
      subjects.add(subject);
      this.streams.set(key, subjects);

      const subscription = subject.subscribe(subscriber);
      void this.getUnreadCount(tenantId, userId).then((unreadCount) => {
        subscriber.next({ kind: 'notifications.snapshot', unreadCount });
      });

      return () => {
        subscription.unsubscribe();
        subject.complete();
        subjects.delete(subject);
        if (subjects.size === 0) {
          this.streams.delete(key);
        }
      };
    });
  }

  async getUserNotifications(tenantId: string, userId: string, skip = 0, take = 20) {
    const boundedSkip = Math.max(skip, 0);
    const boundedTake = Math.min(Math.max(take, 1), 50);
    const [notifications, unreadCount, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: { tenantId, userId },
        orderBy: { createdAt: 'desc' },
        skip: boundedSkip,
        take: boundedTake,
      }),
      this.prisma.notification.count({
        where: { tenantId, userId, readAt: null },
      }),
      this.prisma.notification.count({
        where: { tenantId, userId },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      meta: {
        skip: boundedSkip,
        take: boundedTake,
        total,
        hasMore: boundedSkip + notifications.length < total,
      },
    };
  }

  async markAsRead(tenantId: string, userId: string, id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id_tenantId: { id, tenantId } },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.readAt) {
      return notification;
    }

    const updated = await this.prisma.notification.update({
      where: { id_tenantId: { id, tenantId } },
      data: { readAt: new Date() },
    });
    await this.publish(tenantId, userId, {
      kind: 'notifications.refresh',
      unreadCount: await this.getUnreadCount(tenantId, userId),
    });
    return updated;
  }

  async markAllAsRead(tenantId: string, userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { tenantId, userId, readAt: null },
      data: { readAt: new Date() },
    });

    await this.publish(tenantId, userId, { kind: 'notifications.refresh', unreadCount: 0 });
    return { count: result.count };
  }

  async broadcast(tenantId: string, dto: BroadcastNotificationDto) {
    // Note: For large tenants, this might need to be chunked or sent to a background worker
    // For MVP, we'll create notifications for all active users in the tenant
    const users = await this.prisma.user.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
    });

    if (users.length === 0) {
      return { count: 0 };
    }

    const { count } = await this.prisma.notification.createMany({
      data: users.map((u: { id: string }) => ({
        tenantId,
        userId: u.id,
        title: dto.title,
        content: dto.content,
        type: dto.type,
        actionUrl: dto.actionUrl,
      })),
    });

    for (const user of users) {
      await this.publish(tenantId, user.id, { kind: 'notifications.refresh' });
    }

    return { count };
  }

  // A method for internal modules to send targeted notifications
  async createNotification(
    tenantId: string,
    userId: string,
    title: string,
    content?: string,
    type = 'INFO',
    actionUrl?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        tenantId,
        userId,
        title,
        content,
        type,
        actionUrl,
      },
    });
    await this.publish(tenantId, userId, {
      kind: 'notification.created',
      notification,
      unreadCount: await this.getUnreadCount(tenantId, userId),
    });
    return notification;
  }

  private async getUnreadCount(tenantId: string, userId: string) {
    return this.prisma.notification.count({
      where: { tenantId, userId, readAt: null },
    });
  }

  private async publish(tenantId: string, userId: string, event: NotificationStreamEvent) {
    const subjects = this.streams.get(this.streamKey(tenantId, userId));
    if (!subjects || subjects.size === 0) {
      return;
    }

    for (const subject of subjects) {
      subject.next(event);
    }
  }

  private streamKey(tenantId: string, userId: string) {
    return `${tenantId}:${userId}`;
  }
}
