import { Controller, Get, Post, Res, Req, UseGuards } from '@nestjs/common';
import type { Response, Request } from 'express';
import { McpService } from './mcp.service';
import { McpAuthGuard } from './guards/mcp-auth.guard';

interface SseTransport {
  sessionId: string;
  handlePostMessage(req: Request, res: Response): Promise<void>;
}

@Controller('mcp')
@UseGuards(McpAuthGuard)
export class McpController {
  private readonly transports = new Map<string, SseTransport>();

  constructor(private readonly mcpService: McpService) {}

  @Get('sse')
  async handleSse(@Res() res: Response) {
    const { SSEServerTransport } = await import('@modelcontextprotocol/sdk/server/sse.js');
    const transport = new SSEServerTransport('/api/mcp/messages', res) as SseTransport;
    await this.mcpService.server.connect(transport);
    this.transports.set(transport.sessionId, transport);

    res.on('close', () => {
      this.transports.delete(transport.sessionId);
    });
  }

  @Post('messages')
  async handleMessages(@Req() req: Request, @Res() res: Response) {
    const query = req.query ?? {};
    const sessionId = Array.isArray(query.sessionId) ? query.sessionId[0] : query.sessionId;
    const transport = typeof sessionId === 'string' ? this.transports.get(sessionId) : undefined;

    if (!transport) {
      return res.status(400).send('No active SSE connection');
    }
    await transport.handlePostMessage(req, res);
  }
}
