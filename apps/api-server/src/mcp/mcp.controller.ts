import { Controller, Get, Post, Res, Req, UseGuards } from "@nestjs/common";
import { Response, Request } from "express";
import { McpService } from "./mcp.service";
import { McpAuthGuard } from "./guards/mcp-auth.guard";

@Controller("mcp")
@UseGuards(McpAuthGuard)
export class McpController {
  private transport: any = null;

  constructor(private readonly mcpService: McpService) {}

  @Get("sse")
  async handleSse(@Res() res: Response) {
    const { SSEServerTransport } =
      await import("@modelcontextprotocol/sdk/server/sse.js");
    this.transport = new SSEServerTransport("/mcp/messages", res);
    await this.mcpService.server.connect(this.transport);

    res.on("close", () => {
      this.transport = null;
    });
  }

  @Post("messages")
  async handleMessages(@Req() req: Request, @Res() res: Response) {
    if (!this.transport) {
      return res.status(400).send("No active SSE connection");
    }
    await this.transport.handlePostMessage(req, res);
  }
}
