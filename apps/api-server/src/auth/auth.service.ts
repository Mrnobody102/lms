import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Response } from "express";
import { PrismaService } from "../common/services/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly _prisma: PrismaService,
    private readonly _jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto, tenantId: string, res: Response) {
    const existingUser = await this._prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed — email already exists: ${registerDto.email}`);
      throw new ConflictException("Email already registered");
    }

    const tenant = await this._prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      this.logger.warn(`Registration failed — invalid tenant: ${tenantId}`);
      throw new ConflictException("Invalid tenant");
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this._prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        fullName: registerDto.fullName,
        phoneNumber: registerDto.phoneNumber,
        tenantId: tenantId,
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
      token,
    };
  }

  async login(loginDto: LoginDto, res: Response) {
    const user = await this._prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      // Log attempt but don't reveal email existence (OWASP recommendation)
      this.logger.warn(`Login failed — email not found: ${loginDto.email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed — inactive account: id=${user.id}`);
      throw new UnauthorizedException("Account is inactive");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed — invalid password: id=${user.id}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    this.logger.log(`User logged in: id=${user.id}, role=${user.role}`);

    const token = this.generateToken(user);
    this.setAuthCookie(res, token);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token,
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
    res.cookie("access_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }
}
