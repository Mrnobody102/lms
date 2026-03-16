import { SetMetadata } from "@nestjs/common";

export const MCP_TOOL_METADATA = "mcp:tool";

export interface McpToolOptions {
  name: string;
  description: string;
  schema: any;
}

export const McpTool = (options: McpToolOptions) =>
  SetMetadata(MCP_TOOL_METADATA, options);
