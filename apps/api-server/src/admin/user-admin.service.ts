import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, Role } from '@repo/database';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma.service';
import { AdminUserQueryDto } from './dto/admin-user-query.dto';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-request.interface';

@Injectable()
export class UserAdminService {
  constructor(private prisma: PrismaService) {}

  async createInstructor(
    currentUser: AuthenticatedUser,
    tenantId: string,
    createInstructorDto: CreateInstructorDto,
  ) {
    if (currentUser.role === Role.ADMIN && currentUser.tenantId !== tenantId) {
      throw new ForbiddenException('You can only create instructors in your tenant');
    }

    const email = createInstructorDto.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: {
          equals: email,
          mode: 'insensitive',
        },
        deletedAt: null,
      },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered in this tenant');
    }

    const hashedPassword = await bcrypt.hash(createInstructorDto.password, 12);
    const identity = await this.prisma.globalUserIdentity.upsert({
      where: { normalizedEmail: email },
      update: {
        displayName: createInstructorDto.fullName,
        ...(createInstructorDto.phoneNumber
          ? { phoneNumber: createInstructorDto.phoneNumber }
          : {}),
      },
      create: {
        normalizedEmail: email,
        displayName: createInstructorDto.fullName,
        phoneNumber: createInstructorDto.phoneNumber,
      },
      select: { id: true },
    });

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: createInstructorDto.fullName,
        phoneNumber: createInstructorDto.phoneNumber,
        globalIdentityId: identity.id,
        tenantId,
        role: Role.INSTRUCTOR,
        ...(createInstructorDto.isActive !== undefined
          ? { isActive: createInstructorDto.isActive }
          : {}),
      },
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
  }

  async getUserList(currentUser: AuthenticatedUser, query: AdminUserQueryDto) {
    const { page = 1, limit = 10, email, search, role, isActive, cohortId } = query;
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

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as Role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (cohortId) {
      where.cohortMemberships = {
        some: {
          cohortId,
          ...(currentUser.role === Role.ADMIN ? { tenantId: currentUser.tenantId } : {}),
        },
      };
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
        currentStreak: true,
        lastActiveDate: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            createdAt: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        cohortMemberships: {
          select: {
            id: true,
            createdAt: true,
            cohort: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
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

  async updateUser(
    currentUser: AuthenticatedUser,
    userId: string,
    updateAdminUserDto: UpdateAdminUserDto,
  ) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        tenantId: true,
        isActive: true,
        globalIdentityId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (currentUser.role === Role.ADMIN && user.tenantId !== currentUser.tenantId) {
      throw new ForbiddenException('You can only update users in your tenant');
    }

    if (userId === currentUser.id && updateAdminUserDto.isActive === false) {
      throw new ForbiddenException('You cannot deactivate your own account');
    }

    const data: Prisma.UserUpdateInput = {};
    const identityData: Prisma.GlobalUserIdentityUpdateInput = {};

    if (typeof updateAdminUserDto.fullName === 'string') {
      const fullName = updateAdminUserDto.fullName.trim();
      data.fullName = fullName;
      identityData.displayName = fullName;
    }

    if (updateAdminUserDto.phoneNumber !== undefined) {
      const phoneNumber =
        typeof updateAdminUserDto.phoneNumber === 'string'
          ? updateAdminUserDto.phoneNumber.trim() || null
          : null;
      data.phoneNumber = phoneNumber;
      identityData.phoneNumber = phoneNumber;
    }

    if (updateAdminUserDto.avatarUrl !== undefined) {
      data.avatarUrl = updateAdminUserDto.avatarUrl?.trim() || null;
    }

    if (updateAdminUserDto.isActive !== undefined) {
      data.isActive = updateAdminUserDto.isActive;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
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

    if (user.globalIdentityId && Object.keys(identityData).length > 0) {
      await this.prisma.globalUserIdentity.update({
        where: { id: user.globalIdentityId },
        data: identityData,
      });
    }

    return updatedUser;
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
