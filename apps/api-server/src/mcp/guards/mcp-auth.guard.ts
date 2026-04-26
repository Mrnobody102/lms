import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const mcpEnabled = this.configService.get<boolean>('MCP_ENABLED');
    if (process.env.NODE_ENV === 'production' && !mcpEnabled) {
      throw new NotFoundException('MCP is not enabled');
    }

    const allowQueryApiKey =
      process.env.NODE_ENV !== 'production' &&
      this.configService.get<boolean>('MCP_ALLOW_QUERY_API_KEY');

    const headerApiKey = this.firstString(request.headers['x-api-key']);
    const queryApiKey = allowQueryApiKey ? this.firstString(request.query['apiKey']) : undefined;
    const apiKey = headerApiKey || queryApiKey;

    const expectedApiKey = this.configService.get<string>('MCP_API_KEY');
    if (!expectedApiKey) {
      throw new UnauthorizedException('MCP_API_KEY is not configured on server');
    }

    if (!apiKey || !this.safeEquals(apiKey, expectedApiKey)) {
      throw new UnauthorizedException('Invalid MCP API Key');
    }

    return true;
  }

  private safeEquals(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    return (
      actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
    );
  }

  private firstString(value: unknown): string | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }

    return undefined;
  }
}
