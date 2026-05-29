import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
  it('should create instructor accounts inside the admin tenant', async () => {
    const prisma = {
      globalUserIdentity: {
        upsert: vi.fn().mockResolvedValue({ id: 'identity-1' }),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'instructor-1',
          email: 'teacher@example.com',
          fullName: 'Teacher One',
          role: Role.INSTRUCTOR,
          globalIdentityId: 'identity-1',
          tenantId: 'tenant-1',
          isActive: true,
        }),
      },
    };

    const service = new UserAdminService(prisma as never);
    const result = await service.createInstructor(makeCurrentUser(), 'tenant-1', {
      email: ' Teacher@Example.com ',
      password: 'Password@123',
      fullName: 'Teacher One',
    });

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        email: {
          equals: 'teacher@example.com',
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: { id: true },
    });
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'teacher@example.com',
          fullName: 'Teacher One',
          globalIdentityId: 'identity-1',
          tenantId: 'tenant-1',
          role: Role.INSTRUCTOR,
        }),
      }),
    );
    expect(prisma.globalUserIdentity.upsert).toHaveBeenCalledWith({
      where: { normalizedEmail: 'teacher@example.com' },
      update: { displayName: 'Teacher One' },
      create: {
        normalizedEmail: 'teacher@example.com',
        displayName: 'Teacher One',
        phoneNumber: undefined,
      },
      select: { id: true },
    });
    expect(result).toEqual(expect.objectContaining({ role: Role.INSTRUCTOR }));
  });

  it('should reject duplicate instructor email in a tenant', async () => {
    const prisma = {
      globalUserIdentity: {
        upsert: vi.fn(),
      },
      user: {
        findFirst: vi.fn().mockResolvedValue({ id: 'existing-user' }),
        create: vi.fn(),
      },
    };

    const service = new UserAdminService(prisma as never);

    await expect(
      service.createInstructor(makeCurrentUser(), 'tenant-1', {
        email: 'teacher@example.com',
        password: 'Password@123',
        fullName: 'Teacher One',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.globalUserIdentity.upsert).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('should combine search, status, role, and cohort filters in the user list', async () => {
    const prisma = {
      user: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const service = new UserAdminService(prisma as never);
    await service.getUserList(makeCurrentUser(), {
      page: 1,
      limit: 20,
      search: 'alice',
      role: Role.STUDENT,
      isActive: true,
      cohortId: 'cohort-1',
    });

    expect(prisma.user.count).toHaveBeenCalledWith({
      where: {
        deletedAt: null,
        tenantId: 'tenant-1',
        OR: [
          { email: { contains: 'alice', mode: 'insensitive' } },
          { fullName: { contains: 'alice', mode: 'insensitive' } },
        ],
        role: Role.STUDENT,
        isActive: true,
        cohortMemberships: {
          some: { cohortId: 'cohort-1', tenantId: 'tenant-1' },
        },
      },
    });
  });

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
