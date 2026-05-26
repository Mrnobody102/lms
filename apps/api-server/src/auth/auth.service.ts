import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@repo/database';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import type { CookieOptions, Response } from 'express';
import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import { PrismaService } from '../common/services/prisma.service';
import { AuditLogService, AuditAction, AuditStatus } from '../common/services/audit-log.service';
import { CSRF_COOKIE_NAME } from '../common/middleware/csrf.middleware';
import { parseDurationToMs } from '../config/duration';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto, type GoogleLoginPortal } from './dto/google-login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';

interface GoogleVerifiedPayload {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

interface LoginUserRecord {
  id: string;
  email: string;
  password: string;
  googleSubject: string | null;
  googleEmailVerified: boolean;
  fullName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
  role: Role;
  isActive: boolean;
  tenantId: string;
  tokenVersion: number;
  failedLoginAttempts: number;
  lockoutUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly auditLog: AuditLogService,
  ) {}

  async register(registerDto: RegisterDto, tenantId: string | undefined) {
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

      const { tokenVersion: _tokenVersion, ...user } = createdUser;

      await this.auditLog.log({
        action: AuditAction.REGISTER,
        status: AuditStatus.SUCCESS,
        userId: createdUser.id,
        tenantId,
        metadata: { role: createdUser.role },
      });

      return { user };
    } catch (_error: unknown) {
      this.logger.error(
        `Registration error: tenantId=${tenantId}`,
        _error instanceof Error ? _error.stack : undefined,
      );
      await this.auditLog.log({
        action: AuditAction.REGISTER,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: {
          error: _error instanceof Error ? _error.message : 'Unknown error',
          email,
        },
      });

      if (this.isUniqueConstraintError(_error)) {
        throw new ConflictException('Email already registered');
      }
      throw _error;
    }
  }

  async login(
    loginDto: LoginDto,
    tenantId: string | undefined,
    res: Response,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      this.logger.warn(`Login failed - inactive tenant: ${tenantId}`);
      await this.auditLog.log({
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { reason: 'Inactive or invalid tenant', email: loginDto.email },
      });
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
        failedLoginAttempts: true,
        lockoutUntil: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${email} in tenant ${tenantId}`);
      await this.auditLog.log({
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { reason: 'User not found', email },
      });
      throw this.invalidCredentials();
    }

    // Check for lockout
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockoutUntil.getTime() - Date.now()) / 60000);

      await this.auditLog.log({
        userId: user.id,
        tenantId,
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        ipAddress,
        userAgent,
        metadata: { reason: 'Account locked', waitMinutes },
      });

      throw new BadRequestException(
        `Account is temporarily locked. Try again in ${waitMinutes} minutes.`,
      );
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed - inactive account: id=${user.id}`);
      throw this.invalidCredentials();
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: id=${user.id}`);

      // Increment failed attempts
      const newAttempts = user.failedLoginAttempts + 1;
      const lockoutUntil = newAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lockoutUntil,
        },
      });

      await this.auditLog.log({
        userId: user.id,
        tenantId,
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid password', attempts: newAttempts },
      });

      throw this.invalidCredentials();
    }

    // Reset failed attempts on success
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    this.logger.log(`User logged in: id=${user.id}, role=${user.role}`);

    const token = this.generateToken(user);
    this.setAuthCookie(res, token);
    this.setCsrfCookie(res);
    await this.setRefreshCookie(res, user.id, tenantId, ipAddress, userAgent);

    await this.auditLog.log({
      userId: user.id,
      tenantId,
      action: AuditAction.LOGIN_SUCCESS,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
    });

    const {
      password: _password,
      tokenVersion: _tokenVersion,
      failedLoginAttempts: _fla,
      lockoutUntil: _lu,
      ...userWithoutPassword
    } = user;

    return {
      user: userWithoutPassword,
    };
  }

  async loginWithGoogle(
    googleLoginDto: GoogleLoginDto,
    tenantId: string | undefined,
    res: Response,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      await this.auditLog.log({
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', reason: 'Inactive or invalid tenant' },
      });
      throw this.invalidCredentials();
    }

    const clientIds = this.getGoogleClientIds();
    if (clientIds.length === 0) {
      throw new BadRequestException('Google login is not configured');
    }

    const payload = await this.verifyGoogleCredential(googleLoginDto.credential, clientIds);
    const email = this.normalizeEmail(payload.email);
    const portal = googleLoginDto.portal ?? 'student';

    const userBySubject = await this.prisma.user.findFirst({
      where: {
        tenantId,
        googleSubject: payload.sub,
        deletedAt: null,
      },
      select: this.userWithAuthFieldsSelect(),
    });

    const userByEmail = await this.prisma.user.findFirst({
      where: {
        tenantId,
        email: { equals: email, mode: 'insensitive' },
        deletedAt: null,
      },
      select: this.userWithAuthFieldsSelect(),
    });

    const resolvedUser = userBySubject ?? userByEmail;
    const canAutoProvision = portal === 'student';

    if (!resolvedUser && !canAutoProvision) {
      await this.auditLog.log({
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', portal, reason: 'No matching privileged account', email },
      });
      throw this.invalidCredentials();
    }

    if (resolvedUser && !this.isPortalRoleAllowed(resolvedUser.role, portal)) {
      await this.auditLog.log({
        userId: resolvedUser.id,
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', portal, reason: 'Role not allowed' },
      });
      throw this.invalidCredentials();
    }

    if (resolvedUser && !resolvedUser.isActive) {
      await this.auditLog.log({
        userId: resolvedUser.id,
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', reason: 'Inactive account' },
      });
      throw this.invalidCredentials();
    }

    const user =
      resolvedUser ??
      (await this.createGoogleStudentUser({
        tenantId,
        email,
        fullName: payload.name || email,
        avatarUrl: payload.picture,
        googleSubject: payload.sub,
        googleEmailVerified: payload.emailVerified,
      }));

    if (user.googleSubject && user.googleSubject !== payload.sub) {
      await this.auditLog.log({
        userId: user.id,
        action: AuditAction.LOGIN_FAILURE,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { provider: 'google', reason: 'Google account conflict' },
      });
      throw this.invalidCredentials();
    }

    const loginUser =
      user.googleSubject === payload.sub
        ? user
        : await this.linkGoogleAccount(user.id, tenantId, payload.sub, payload.emailVerified);

    await this.prisma.user.update({
      where: { id_tenantId: { id: loginUser.id, tenantId } },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    const token = this.generateToken(loginUser);
    this.setAuthCookie(res, token);
    this.setCsrfCookie(res);
    await this.setRefreshCookie(res, loginUser.id, tenantId, ipAddress, userAgent);

    await this.auditLog.log({
      userId: loginUser.id,
      tenantId,
      action: AuditAction.LOGIN_SUCCESS,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
      metadata: { provider: 'google', portal },
    });

    return {
      user: this.toSafeUser(loginUser),
    };
  }

  async logout(
    cookies: Record<string, string>,
    res: Response,
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const refreshToken = cookies['refresh_token'];

    if (refreshToken) {
      try {
        const hash = await this.hashToken(refreshToken);
        await this.prisma.refreshToken.deleteMany({
          where: { tokenHash: hash, tenantId, userId },
        });
      } catch (e) {
        this.logger.warn('Failed to revoke refresh token during logout', e);
      }
    }

    await this.auditLog.log({
      userId,
      tenantId,
      action: AuditAction.LOGOUT,
      status: AuditStatus.SUCCESS,
      ipAddress,
      userAgent,
    });

    this.clearAuthCookie(res);
    this.clearCsrfCookie(res);
    this.clearRefreshCookie(res);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async refresh(
    cookies: Record<string, string>,
    tenantId: string | undefined,
    res: Response,
    ipAddress?: string,
    userAgent?: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const refreshTokenStr = cookies['refresh_token'];
    if (!refreshTokenStr) {
      this.clearAuthCookie(res);
      this.clearCsrfCookie(res);
      await this.auditLog.log({
        action: AuditAction.SESSION_REFRESH,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { reason: 'No refresh token provided' },
      });
      throw new UnauthorizedException('No refresh token provided');
    }

    const hash = await this.hashToken(refreshTokenStr);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { tokenHash: hash, tenantId },
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
      await this.auditLog.log({
        userId: storedToken?.userId,
        action: AuditAction.SESSION_REFRESH,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid or expired refresh token' },
      });
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive || storedToken.user.tenantId !== tenantId) {
      this.clearAuthCookie(res);
      this.clearCsrfCookie(res);
      this.clearRefreshCookie(res);
      await this.auditLog.log({
        userId: storedToken.userId,
        action: AuditAction.SESSION_REFRESH,
        status: AuditStatus.FAILURE,
        tenantId,
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid user account or wrong tenant' },
      });
      throw new UnauthorizedException('Invalid user account');
    }

    // Revoke old token
    await this.prisma.refreshToken.updateMany({
      where: { id: storedToken.id, tenantId },
      data: { revokedAt: new Date() },
    });

    // Issue new tokens
    const newAccessToken = this.generateToken(storedToken.user);
    this.setAuthCookie(res, newAccessToken);
    this.setCsrfCookie(res);
    await this.setRefreshCookie(res, storedToken.user.id, tenantId, ipAddress, userAgent);

    await this.auditLog.log({
      userId: storedToken.userId,
      action: AuditAction.SESSION_REFRESH,
      status: AuditStatus.SUCCESS,
      tenantId,
      ipAddress,
      userAgent,
    });

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
      await this.auditLog.log({
        action: AuditAction.PASSWORD_RESET_REQUEST,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: { reason: 'User not found', email },
      });
      // Do not reveal if email exists or not
      return { success: true, message: 'If your email is registered, a reset link will be sent.' };
    }

    await this.auditLog.log({
      userId: user.id,
      tenantId,
      action: AuditAction.PASSWORD_RESET_REQUEST,
      status: AuditStatus.SUCCESS,
    });

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

    const appUrl =
      this.configService.get<string>('NEXT_PUBLIC_WEB_STUDENT_URL') || 'http://localhost:3100';
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
      await this.auditLog.log({
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: { reason: 'Token verification failed' },
      });
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (decoded.type !== 'reset' || !decoded.sub) {
      await this.auditLog.log({
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: { reason: 'Invalid token type' },
      });
      throw new UnauthorizedException('Invalid token type');
    }

    const userId = decoded.sub;
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null, isActive: true },
    });

    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
      await this.auditLog.log({
        userId,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: { reason: 'Invalid or missing user reset hash' },
      });
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.passwordResetExpiresAt < new Date()) {
      await this.auditLog.log({
        userId,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: { reason: 'Reset token expired' },
      });
      throw new UnauthorizedException('Reset token has expired');
    }

    const isValidHash = await bcrypt.compare(resetPasswordDto.token, user.passwordResetTokenHash);
    if (!isValidHash) {
      await this.auditLog.log({
        userId,
        action: AuditAction.PASSWORD_RESET,
        status: AuditStatus.FAILURE,
        tenantId,
        metadata: { reason: 'Hash mismatch' },
      });
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

    await this.auditLog.log({
      userId,
      tenantId,
      action: AuditAction.PASSWORD_RESET_SUCCESS,
      status: AuditStatus.SUCCESS,
    });

    return { success: true, message: 'Password reset successfully' };
  }

  private async verifyGoogleCredential(
    credential: string,
    clientIds: string[],
  ): Promise<GoogleVerifiedPayload> {
    let payload: TokenPayload | undefined;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: clientIds,
      });
      payload = ticket.getPayload();
    } catch (error) {
      this.logger.warn(
        `Google login failed - token verification failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
      throw this.invalidCredentials();
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw this.invalidCredentials();
    }

    return {
      sub: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    };
  }

  private getGoogleClientIds(): string[] {
    const single = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const multiple = this.configService.get<string>('GOOGLE_CLIENT_IDS');

    return [
      ...(single ? [single] : []),
      ...(multiple
        ? multiple
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
        : []),
    ];
  }

  private userWithAuthFieldsSelect() {
    return {
      id: true,
      email: true,
      password: true,
      googleSubject: true,
      googleEmailVerified: true,
      fullName: true,
      phoneNumber: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      tenantId: true,
      tokenVersion: true,
      failedLoginAttempts: true,
      lockoutUntil: true,
      createdAt: true,
      updatedAt: true,
    } as const;
  }

  private isPortalRoleAllowed(role: Role, portal: GoogleLoginPortal): boolean {
    if (portal === 'super') {
      return role === Role.SUPER_ADMIN;
    }

    if (portal === 'admin') {
      return role === Role.ADMIN || role === Role.SUPER_ADMIN;
    }

    return role === Role.STUDENT;
  }

  private async createGoogleStudentUser(options: {
    tenantId: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    googleSubject: string;
    googleEmailVerified: boolean;
  }): Promise<LoginUserRecord> {
    const randomPasswordHash = await bcrypt.hash(randomBytes(48).toString('hex'), 12);

    return this.prisma.user.create({
      data: {
        email: options.email,
        password: randomPasswordHash,
        googleSubject: options.googleSubject,
        googleEmailVerified: options.googleEmailVerified,
        fullName: options.fullName,
        avatarUrl: options.avatarUrl,
        tenantId: options.tenantId,
        role: Role.STUDENT,
      },
      select: this.userWithAuthFieldsSelect(),
    });
  }

  private async linkGoogleAccount(
    userId: string,
    tenantId: string,
    googleSubject: string,
    googleEmailVerified: boolean,
  ): Promise<LoginUserRecord> {
    return this.prisma.user.update({
      where: { id_tenantId: { id: userId, tenantId } },
      data: {
        googleSubject,
        googleEmailVerified,
      },
      select: this.userWithAuthFieldsSelect(),
    });
  }

  private toSafeUser(user: LoginUserRecord) {
    const {
      password: _password,
      tokenVersion: _tokenVersion,
      failedLoginAttempts: _failedLoginAttempts,
      lockoutUntil: _lockoutUntil,
      googleSubject: _googleSubject,
      googleEmailVerified: _googleEmailVerified,
      ...safeUser
    } = user;

    return safeUser;
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
    const configuredSameSite = this.configService.get<'lax' | 'strict' | 'none'>(
      'AUTH_COOKIE_SAME_SITE',
    );
    const sameSite = configuredSameSite ?? (process.env.NODE_ENV === 'production' ? 'none' : 'lax');
    const domain = this.configService.get<string>('AUTH_COOKIE_DOMAIN') || undefined;

    return {
      secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
      sameSite,
      domain,
      path: '/',
    };
  }

  public async hashToken(token: string): Promise<string> {
    const { createHash } = await import('crypto');
    return createHash('sha256').update(token).digest('hex');
  }

  private async setRefreshCookie(
    res: Response,
    userId: string,
    tenantId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
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
        ipAddress,
        userAgent,
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
