import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

@Injectable()
export class McpService implements OnModuleInit {
  private readonly logger = new Logger(McpService.name);
  private mcpServer: any;

  async onModuleInit() {
    const { Server } =
      await import("@modelcontextprotocol/sdk/server/index.js");
    const { ListToolsRequestSchema } =
      await import("@modelcontextprotocol/sdk/types.js");

    this.mcpServer = new Server(
      {
        name: "lms-platform-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );

    this.setupHandlers(ListToolsRequestSchema);
    this.logger.log("MCP Server initialized via Dynamic Import");
  }

  private setupHandlers(ListToolsRequestSchema: any) {
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [],
    }));

    this.mcpServer.onerror = (error: any) => {
      this.logger.error("MCP Server Error:", error);
    };
  }

  get server() {
    return this.mcpServer;
  }
}
