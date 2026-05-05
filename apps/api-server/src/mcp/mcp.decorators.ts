import { SetMetadata } from '@nestjs/common';
import type { ZodTypeAny } from 'zod';

export const MCP_TOOL_METADATA = 'mcp:tool';

export interface McpToolOptions {
  name: string;
  description: string;
  schema: ZodTypeAny;
}

export const McpTool = (options: McpToolOptions) => SetMetadata(MCP_TOOL_METADATA, options);
