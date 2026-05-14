import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { PrismaService } from '../common/services/prisma.service';
import { CSRF_COOKIE_NAME } from '../common/middleware/csrf.middleware';
import { parseDurationToMs } from '../config/duration';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      this.logger.warn(`Registration failed - invalid tenant: ${tenantId}`);
      throw new ConflictException('Invalid tenant');
    }

    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - email already exists: tenantId=${tenantId}`);
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    try {
      const createdUser = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName: registerDto.fullName,
          phoneNumber: registerDto.phoneNumber,
          tenantId,
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
          tokenVersion: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`User registered: id=${createdUser.id}, role=${createdUser.role}`);

      const token = this.generateToken(createdUser);
      this.setAuthCookie(res, token);
      this.setCsrfCookie(res);
      await this.setRefreshCookie(res, createdUser.id, tenantId);

      const { tokenVersion: _tokenVersion, ...user } = createdUser;

      return {
        user,
      };
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        this.logger.warn(`Registration failed - email already exists: tenantId=${tenantId}`);
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      this.logger.warn(`Login failed - inactive tenant: ${tenantId}`);
      throw this.invalidCredentials();
    }

    const email = this.normalizeEmail(loginDto.email);
    const user = await this.prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
        tenantId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        phoneNumber: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        tenantId: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login failed - invalid credentials: tenantId=${tenantId}`);
      throw this.invalidCredentials();
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed - inactive account: id=${user.id}`);
      throw this.invalidCredentials();
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: id=${user.id}`);
      throw this.invalidCredentials();
    }

    this.logger.log(`User logged in: id=${user.id}, role=${user.role}`);

    const token = this.generateToken(user);
    this.setAuthCookie(res, token);
    this.setCsrfCookie(res);
    await this.setRefreshCookie(res, user.id, tenantId);

    const { password: _password, tokenVersion: _tokenVersion, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  }

  async logout(cookies: Record<string, string>, res: Response) {
    const refreshToken = cookies['refresh_token'];

    if (refreshToken) {
      try {
        const hash = await this.hashToken(refreshToken);
        await this.prisma.refreshToken.delete({
          where: { tokenHash: hash },
        });
      } catch (e) {
        this.logger.warn('Failed to revoke refresh token during logout', e);
      }
    }

    this.clearAuthCookie(res);
    this.clearCsrfCookie(res);
    this.clearRefreshCookie(res);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async refresh(cookies: Record<string, string>, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const refreshTokenStr = cookies['refresh_token'];
    if (!refreshTokenStr) {
      this.clearAuthCookie(res);
      this.clearCsrfCookie(res);
      throw new UnauthorizedException('No refresh token provided');
    }

    const hash = await this.hashToken(refreshTokenStr);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            tenantId: true,
            tokenVersion: true,
          },
        },
      },
    });

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      this.clearAuthCookie(res);
      this.clearCsrfCookie(res);
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive || storedToken.user.tenantId !== tenantId) {
      this.clearAuthCookie(res);
      this.clearCsrfCookie(res);
      this.clearRefreshCookie(res);
      throw new UnauthorizedException('Invalid user account');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const newAccessToken = this.generateToken(storedToken.user);
    this.setAuthCookie(res, newAccessToken);
    this.setCsrfCookie(res);
    await this.setRefreshCookie(res, storedToken.user.id, tenantId);

    return { success: true };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, tenantId: string | undefined) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const email = this.normalizeEmail(forgotPasswordDto.email);
    const user = await this.prisma.user.findFirst({
      where: { email, tenantId, deletedAt: null, isActive: true },
      select: { id: true },
    });

    if (!user) {
      // Do not reveal if email exists or not
      return { success: true, message: 'If your email is registered, a reset link will be sent.' };
    }

    // Generate short-lived token (15 mins)
    const resetSecret =
      this.configService.get<string>('JWT_RESET_SECRET') ||
      this.configService.get<string>('JWT_SECRET');
    const resetTokenStr = this.jwtService.sign(
      { sub: user.id, type: 'reset' },
      { secret: resetSecret, expiresIn: '15m' },
    );

    const tokenHash = await bcrypt.hash(resetTokenStr, 10);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { id_tenantId: { id: user.id, tenantId } },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const appUrl = this.configService.get<string>('APP_PUBLIC_URL') || 'http://localhost:3000';
    const locale = forgotPasswordDto.locale || 'vi';
    const resetUrl = `${appUrl}/${locale}/reset-password?token=${encodeURIComponent(resetTokenStr)}`;

    // Fire and forget email
    this.mailService.sendPasswordResetEmail(email, resetUrl, locale).catch((e) => {
      this.logger.error(`Failed to send password reset email to ${email}`, e);
    });

    return { success: true, message: 'If your email is registered, a reset link will be sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto, tenantId: string | undefined) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const resetSecret =
      this.configService.get<string>('JWT_RESET_SECRET') ||
      this.configService.get<string>('JWT_SECRET');

    let decoded: { sub: string; type: string };
    try {
      decoded = this.jwtService.verify(resetPasswordDto.token, { secret: resetSecret });
    } catch (_e) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (decoded.type !== 'reset' || !decoded.sub) {
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = decoded.sub;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null, isActive: true },
    });

    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const isValidHash = await bcrypt.compare(resetPasswordDto.token, user.passwordResetTokenHash);
    if (!isValidHash) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 12);

    await this.prisma.user.update({
      where: { id_tenantId: { id: userId, tenantId } },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        tokenVersion: { increment: 1 },
      },
    });

    // Revoke all refresh tokens to force re-login on all devices
    await this.prisma.refreshToken.deleteMany({
      where: { userId, tenantId },
    });

    return { success: true, message: 'Password reset successfully' };
  }

  private generateToken(user: {
    id: string;
    email: string;
    role: string;
    tenantId: string;
    tokenVersion?: number;
  }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tokenVersion: user.tokenVersion ?? 0,
    };

    return this.jwtService.sign(payload);
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException('Invalid credentials');
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private isUniqueConstraintError(error: unknown): boolean {
    const prismaError = error as { code?: string };
    return prismaError.code === 'P2002';
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('access_token', token, {
      ...this.getCookieOptions(),
      httpOnly: true,
      maxAge: parseDurationToMs(this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d'),
    });
  }

  private clearAuthCookie(res: Response): void {
    res.clearCookie('access_token', {
      ...this.getCookieOptions(),
      httpOnly: true,
    });
  }

  private setCsrfCookie(res: Response): void {
    res.cookie(CSRF_COOKIE_NAME, randomBytes(32).toString('hex'), {
      ...this.getCookieOptions(),
      httpOnly: false,
      maxAge: parseDurationToMs(this.configService.get<string>('JWT_EXPIRES_IN') ?? '7d'),
    });
  }

  private clearCsrfCookie(res: Response): void {
    res.clearCookie(CSRF_COOKIE_NAME, {
      ...this.getCookieOptions(),
      httpOnly: false,
    });
  }

  private getCookieOptions(): CookieOptions {
    const sameSite =
      this.configService.get<'lax' | 'strict' | 'none'>('AUTH_COOKIE_SAME_SITE') ?? 'lax';
    const domain = this.configService.get<string>('AUTH_COOKIE_DOMAIN') || undefined;

    return {
      secure: process.env.NODE_ENV === 'production',
      sameSite,
      domain,
      path: '/',
    };
  }

  private async hashToken(token: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  private async setRefreshCookie(res: Response, userId: string, tenantId: string): Promise<void> {
    const refreshStr = randomBytes(40).toString('hex');
    const hash = await this.hashToken(refreshStr);
    const msTTL = parseDurationToMs(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d',
    );

    // Cleanup: Remove expired or revoked tokens for this user/tenant to prevent bloat
    try {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          tenantId,
          OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null } }],
        },
      });
    } catch (e) {
      this.logger.warn(`Failed to cleanup old refresh tokens for user ${userId}`, e);
    }

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tenantId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + msTTL),
      },
    });

    res.cookie('refresh_token', refreshStr, {
      ...this.getCookieOptions(),
      httpOnly: true,
      maxAge: msTTL,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie('refresh_token', {
      ...this.getCookieOptions(),
      httpOnly: true,
    });
  }
}
