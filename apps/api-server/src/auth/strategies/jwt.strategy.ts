import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

import {
  clearAuthUserCacheForTests,
  getCachedAuthUser,
  setCachedAuthUser,
  type CachedAuthUser,
} from '../../common/cache/auth-user-cache';
import { PrismaService } from '../../common/services/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  tenantId: string;
  tokenVersion?: number;
}

type ValidatedUser = Omit<CachedAuthUser, 'tokenVersion'>;

/** Test-only: clear the in-process validated-user cache between cases. */
export function clearJwtUserCacheForTests(): void {
  clearAuthUserCacheForTests();
}

function toValidatedUser(user: CachedAuthUser): ValidatedUser {
  const { tokenVersion: _tokenVersion, ...safeUser } = user;
  return safeUser;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          return (req.cookies as Record<string, string>)?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload): Promise<ValidatedUser> {
    const cached = getCachedAuthUser(payload.sub);
    if (
      cached &&
      cached.tenantId === payload.tenantId &&
      cached.tokenVersion === (payload.tokenVersion ?? 0)
    ) {
      return toValidatedUser(cached);
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null },
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
        tenant: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!user || !user.isActive || !user.tenant.isActive) {
      throw new UnauthorizedException('User not found, inactive, or tenant is disabled');
    }

    if (payload.tenantId !== user.tenantId) {
      throw new UnauthorizedException('Token tenant mismatch');
    }

    if ((payload.tokenVersion ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const { tenant: _tenant, ...cacheUser } = user;
    setCachedAuthUser(cacheUser);
    return toValidatedUser(cacheUser);
  }
}
