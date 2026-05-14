import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/services/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
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

    return user;
  }

  async updateProfile(userId: string, tenantId: string, updateProfileDto: UpdateProfileDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id_tenantId: { id: userId, tenantId } },
      data: updateProfileDto,
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

    return user;
  }

  async changePassword(userId: string, tenantId: string, changePasswordDto: ChangePasswordDto) {
    // Get current user with password
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password (OWASP recommends cost factor >= 12)
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 12);

    // Update password and increment version to revoke all existing access tokens
    await this.prisma.user.update({
      where: { id_tenantId: { id: userId, tenantId } },
      data: {
        password: hashedPassword,
        tokenVersion: { increment: 1 },
      },
    });

    // Revoke all refresh tokens to force re-login on all devices
    await this.prisma.refreshToken.deleteMany({
      where: { userId, tenantId },
    });

    return { message: 'Password changed successfully' };
  }
}
