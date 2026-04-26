import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { McpRegisteredTool, McpService } from './mcp.service';
import { MCP_TOOL_METADATA, McpToolOptions } from './mcp.decorators';

@Injectable()
export class McpRegistryService implements OnModuleInit {
  private readonly logger = new Logger(McpRegistryService.name);
  private tools = new Map<string, McpRegisteredTool>();

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly mcpService: McpService,
  ) {}

  async onModuleInit() {
    this.explore();
    this.mcpService.registerTools(this.tools);
  }

  private explore() {
    const providers = this.discoveryService.getProviders();

    providers.forEach((wrapper: any) => {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) return;

      this.metadataScanner.getAllMethodNames(instance).forEach((methodName: string) => {
        const method = instance[methodName];
        const metadata = this.reflector.get<McpToolOptions>(MCP_TOOL_METADATA, method);

        if (metadata) {
          this.tools.set(metadata.name, {
            handler: method.bind(instance) as McpRegisteredTool['handler'],
            options: metadata,
          });
          this.logger.log(`Discovered MCP Tool: ${metadata.name}`);
        }
      });
    });
  }
}
