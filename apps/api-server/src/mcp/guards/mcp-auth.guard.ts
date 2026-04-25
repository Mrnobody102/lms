import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

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

    const apiKey =
      (request.headers['x-api-key'] as string) ||
      (allowQueryApiKey ? (request.query['apiKey'] as string) : undefined);

    const expectedApiKey = this.configService.get<string>('MCP_API_KEY');
    if (!expectedApiKey) {
      throw new UnauthorizedException('MCP_API_KEY is not configured on server');
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException('Invalid MCP API Key');
    }

    return true;
  }
}
