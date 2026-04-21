import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../common/services/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const existingUser = await this._prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed - email already exists: ${registerDto.email}`);
      throw new ConflictException('Email already registered');
    }

    const tenant = await this._prisma.tenant.findFirst({
      where: { id: tenantId, isActive: true },
    });

    if (!tenant) {
      this.logger.warn(`Registration failed - invalid tenant: ${tenantId}`);
      throw new ConflictException('Invalid tenant');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this._prisma.user.create({
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

    return {
      user,
    };
  }

  async login(loginDto: LoginDto, tenantId: string | undefined, res: Response) {
    if (!tenantId) {
      throw new BadRequestException('Tenant context is required');
    }

    const user = await this._prisma.user.findFirst({
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

    const tenant = await this._prisma.tenant.findFirst({
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

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
    };
  }

  logout(res: Response) {
    this.clearAuthCookie(res);

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

    return this._jwtService.sign(payload);
  }

  private setAuthCookie(res: Response, token: string): void {
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearAuthCookie(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
