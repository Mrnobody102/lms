import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { DiscoveryService, MetadataScanner, Reflector } from "@nestjs/core";
import { McpService } from "./mcp.service";
import { MCP_TOOL_METADATA, McpToolOptions } from "./mcp.decorators";
import { zodToJsonSchema } from "zod-to-json-schema";

@Injectable()
export class McpRegistryService implements OnModuleInit {
  private readonly logger = new Logger(McpRegistryService.name);
  private tools = new Map<
    string,
    { handler: Function; options: McpToolOptions }
  >();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly mcpService: McpService,
  ) {}

  async onModuleInit() {
    this.explore();
    await this.registerWithMcp();
  }

  private explore() {
    const providers = this.discoveryService.getProviders();

    providers.forEach((wrapper) => {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) return;

      this.metadataScanner.getAllMethodNames(instance).forEach((methodName) => {
        const method = instance[methodName];
        const metadata = this.reflector.get<McpToolOptions>(
          MCP_TOOL_METADATA,
          method,
        );

        if (metadata) {
          this.tools.set(metadata.name, {
            handler: method.bind(instance),
            options: metadata,
          });
          this.logger.log(`Discovered MCP Tool: ${metadata.name}`);
        }
      });
    });
  }

  private async registerWithMcp() {
    const { CallToolRequestSchema } =
      await import("@modelcontextprotocol/sdk/types.js");
    const server = this.mcpService.server;
    if (!server) {
      this.logger.warn("MCP Server not initialized yet, skipping registration");
      return;
    }

    // Override list tools
    server.setRequestHandler({ method: "tools/list" } as any, async () => ({
      tools: Array.from(this.tools.values()).map((t) => ({
        name: t.options.name,
        description: t.options.description,
        inputSchema: zodToJsonSchema(t.options.schema),
      })),
    }));

    // Handle tool execution
    server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      try {
        const args = tool.options.schema.parse(request.params.arguments);
        const result = await tool.handler(args);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      } catch (error: any) {
        return {
          content: [{ type: "text", text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }
}
