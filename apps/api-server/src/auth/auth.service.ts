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

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: registerDto.email } },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - email already exists: ${registerDto.email}`);
      throw new ConflictException('Email already registered');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      this.logger.warn(`Registration failed - invalid tenant: ${tenantId}`);
      throw new ConflictException('Invalid tenant');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
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
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User registered: id=${user.id}, email=${user.email}, role=${user.role}`);

    const token = this.generateToken(user);
    this.setAuthCookie(res, token);
    this.setCsrfCookie(res);

    return {
      user,
    };
  }

  async login(loginDto: LoginDto, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
        tenantId,
        deletedAt: null,
      },
    });

    if (!user) {
      this.logger.warn(`Login failed - invalid tenant/email combination: ${loginDto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed - inactive account: id=${user.id}`);
      throw new UnauthorizedException('Account is inactive');
    }

    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
      select: { id: true },
    });

    if (!tenant) {
      this.logger.warn(`Login failed - inactive tenant: ${tenantId}`);
      throw new UnauthorizedException('Tenant is inactive');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password: id=${user.id}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: id=${user.id}, role=${user.role}`);

    const token = this.generateToken(user);
    this.setAuthCookie(res, token);
    this.setCsrfCookie(res);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  }

  logout(res: Response) {
    this.clearAuthCookie(res);
    this.clearCsrfCookie(res);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  private generateToken(user: { id: string; email: string; role: string; tenantId: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return this.jwtService.sign(payload);
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
}
