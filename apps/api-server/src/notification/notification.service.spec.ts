import { describe, expect, it, vi } from 'vitest';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  it('caps notification list bounds at the service boundary', async () => {
    const prisma = {
      notification: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    const service = new NotificationService(prisma as never);

    const result = await service.getUserNotifications('tenant-1', 'user-1', -10, 10_000);

    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-1', userId: 'user-1' },
        skip: 0,
        take: 50,
      }),
    );
    expect(result.meta).toEqual({
      skip: 0,
      take: 50,
      total: 0,
      hasMore: false,
    });
  });
});
