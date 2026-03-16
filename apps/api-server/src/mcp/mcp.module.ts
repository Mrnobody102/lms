import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { McpService } from "./mcp.service";
import { McpController } from "./mcp.controller";
import { McpRegistryService } from "./mcp-registry.service";
import { McpCoreSkillsService } from "./mcp-core-skills.service";

@Module({
  imports: [DiscoveryModule],
  providers: [McpService, McpRegistryService, McpCoreSkillsService],
  controllers: [McpController],
  exports: [McpService],
})
export class McpModule {}
