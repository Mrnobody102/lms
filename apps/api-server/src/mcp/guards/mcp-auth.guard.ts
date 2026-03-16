import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";

@Injectable()
export class McpAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Kiểm tra API Key từ Header hoặc Query Params (dành cho SSE)
    const apiKey =
      (request.headers["x-api-key"] as string) ||
      (request.query["apiKey"] as string);

    const expectedApiKey = this.configService.get<string>("MCP_API_KEY");

    if (!expectedApiKey) {
      // Nếu chưa cấu hình Key trên Server, tạm thời cho phép hoặc chặn tùy policy
      // Ở đây ta chặn để đảm bảo an toàn Production
      throw new UnauthorizedException(
        "MCP_API_KEY is not configured on server",
      );
    }

    if (apiKey !== expectedApiKey) {
      throw new UnauthorizedException("Invalid MCP API Key");
    }

    return true;
  }
}
