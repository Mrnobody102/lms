import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpController } from './mcp.controller';
import { McpService } from './mcp.service';
import { ConfigService } from '@nestjs/config';
import { McpAuthGuard } from './guards/mcp-auth.guard';
import type { Request, Response } from 'express';

vi.mock('@modelcontextprotocol/sdk/server/sse.js', () => ({
  SSEServerTransport: class MockSSEServerTransport {
    sessionId = 'session-1';

    constructor(_path: string, _res: Response) {}

    async handlePostMessage() {
      return undefined;
    }
  },
}));

describe('McpController', () => {
  let controller: McpController;
  let mcpService: any;
  let configService: any;

  beforeEach(async () => {
    mcpService = {
      server: {
        connect: vi.fn().mockResolvedValue(undefined),
      },
    };

    configService = {
      get: vi.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        { provide: McpService, useValue: mcpService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    controller = module.get<McpController>(McpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('handleSse', () => {
    it('should initialize SSE transport and connect to service', async () => {
      const mockRes = {
        on: vi.fn(),
      } as unknown as Response;

      await controller.handleSse(mockRes);

      expect(mcpService.server.connect).toHaveBeenCalled();
    });
  });

  describe('handleMessages', () => {
    it('should return 400 if no active transport', async () => {
      const mockReq = {} as Request;
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.handleMessages(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.send).toHaveBeenCalledWith('No active SSE connection');
    });
  });
});

describe('McpAuthGuard', () => {
  let guard: McpAuthGuard;
  let configService: any;

  beforeEach(() => {
    configService = {
      get: vi.fn(),
    };
    guard = new McpAuthGuard(configService);
  });

  it('should allow access with correct API Key in header', () => {
    configService.get.mockReturnValue('valid-key');
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-api-key': 'valid-key' },
          query: {},
        }),
      }),
    } as any;

    expect(guard.canActivate(mockContext)).toBe(true);
  });

  it('should throw UnauthorizedException with incorrect API Key', () => {
    configService.get.mockReturnValue('valid-key');
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { 'x-api-key': 'wrong-key' },
          query: {},
        }),
      }),
    } as any;

    expect(() => guard.canActivate(mockContext)).toThrow('Invalid MCP API Key');
  });

  it('should allow API Key from query params only when explicitly enabled outside production', () => {
    configService.get.mockImplementation((key: string) => {
      if (key === 'MCP_ALLOW_QUERY_API_KEY') return true;
      if (key === 'MCP_API_KEY') return 'valid-key';
      return undefined;
    });
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          query: { apiKey: 'valid-key' },
        }),
      }),
    } as any;

    expect(guard.canActivate(mockContext)).toBe(true);
  });
});
