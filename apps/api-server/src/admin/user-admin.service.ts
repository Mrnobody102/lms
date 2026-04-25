import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma, Role } from '@repo/database';
import { PrismaService } from '../common/services/prisma.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';

@Injectable()
export class UserAdminService {
  constructor(private prisma: PrismaService) {}

  async getUserList(currentUser: AuthenticatedUser, query: AdminUserQueryDto) {
    const { page = 1, limit = 10, email, role, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (currentUser.role === Role.ADMIN) {
      where.tenantId = currentUser.tenantId;
    }

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const total = await this.prisma.user.count({ where });

    const users = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(currentUser: AuthenticatedUser, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.role === Role.ADMIN && user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('You can only view users in your tenant');
    }

    return user;
  }

  async updateUserStatus(
    currentUser: AuthenticatedUser,
    userId: string,
    updateUserStatusDto: UpdateUserStatusDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.role === Role.ADMIN && user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('You can only update users in your tenant');
    }

    if (userId === currentUser.id) {
      throw new ForbiddenException('You cannot change your own status');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: updateUserStatusDto.isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
