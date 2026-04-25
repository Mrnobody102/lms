import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role } from '@repo/database';
import { describe, expect, it, vi } from 'vitest';
import { UserAdminService } from './user-admin.service';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';

function makeCurrentUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 'admin-1',
    email: 'admin@example.com',
    fullName: 'Admin User',
    phoneNumber: null,
    avatarUrl: null,
    role: Role.ADMIN,
    isActive: true,
    tenantId: 'tenant-1',
    createdAt: new Date('2026-04-21T00:00:00.000Z'),
    updatedAt: new Date('2026-04-21T00:00:00.000Z'),
    ...overrides,
  };
}

describe('UserAdminService', () => {
  it('should not update a soft-deleted user status', async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        update: vi.fn(),
      },
    };

    const service = new UserAdminService(prisma as never);

    await expect(
      service.updateUserStatus(makeCurrentUser(), 'deleted-user-id', { isActive: true }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: 'deleted-user-id', deletedAt: null },
    });
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('should block tenant admins from updating users in another tenant', async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue({
          id: 'user-2',
          tenantId: 'tenant-2',
        }),
        update: vi.fn(),
      },
    };

    const service = new UserAdminService(prisma as never);

    await expect(
      service.updateUserStatus(makeCurrentUser(), 'user-2', { isActive: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
