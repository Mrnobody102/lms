import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { BroadcastNotificationDto } from './dto/broadcast.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserNotifications(tenantId: string, userId: string, skip = 0, take = 20) {
    const notifications = await this.prisma.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    const unreadCount = await this.prisma.notification.count({
      where: { tenantId, userId, readAt: null },
    });

    return { notifications, unreadCount };
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

    return this.prisma.notification.update({
      where: { id_tenantId: { id, tenantId } },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(tenantId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { tenantId, userId, readAt: null },
      data: { readAt: new Date() },
    });
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
    return this.prisma.notification.create({
      data: {
        tenantId,
        userId,
        title,
        content,
        type,
        actionUrl,
      },
    });
  }
}
