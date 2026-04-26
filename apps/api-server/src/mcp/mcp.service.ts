import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface McpRegisteredTool {
  handler: (args: unknown) => unknown;
  options: {
    name: string;
    description: string;
    schema: ZodTypeAny;
  };
}

@Injectable()
export class McpService implements OnModuleInit {
  private readonly logger = new Logger(McpService.name);
  private mcpServer: any = null;
  private listToolsRequestSchema: any = null;
  private callToolRequestSchema: any = null;
  private tools = new Map<string, McpRegisteredTool>();

  async onModuleInit() {
    const { Server } = await import('@modelcontextprotocol/sdk/server/index.js');
    const { CallToolRequestSchema, ListToolsRequestSchema } =
      await import('@modelcontextprotocol/sdk/types.js');

    this.mcpServer = new Server(
      {
        name: 'lms-platform-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );
    this.listToolsRequestSchema = ListToolsRequestSchema;
    this.callToolRequestSchema = CallToolRequestSchema;
    this.applyHandlers();
    this.logger.log('MCP Server initialized via Dynamic Import');
  }

  registerTools(tools: Map<string, McpRegisteredTool>) {
    this.tools = new Map(tools);
    this.applyHandlers();
  }

  private applyHandlers() {
    if (!this.mcpServer || !this.listToolsRequestSchema || !this.callToolRequestSchema) {
      return;
    }

    this.mcpServer.setRequestHandler(this.listToolsRequestSchema, async () => ({
      tools: Array.from(this.tools.values()).map((tool) => ({
        name: tool.options.name,
        description: tool.options.description,
        inputSchema: zodToJsonSchema(tool.options.schema as never),
      })),
    }));

    this.mcpServer.setRequestHandler(this.callToolRequestSchema, async (request: any) => {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      try {
        const args = tool.options.schema.parse(request.params.arguments);
        const result = await tool.handler(args);

        return {
          content: [{ type: 'text', text: JSON.stringify(result) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown MCP tool error';
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    });

    this.mcpServer.onerror = (error: unknown) => {
      this.logger.error('MCP Server Error:', error);
    };
  }

  get server() {
    return this.mcpServer;
  }
}
