import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { McpService } from './mcp.service';

const handlerRegistry = new Map<string, Function>();

vi.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: class MockServer {
    connect = vi.fn().mockResolvedValue(undefined);

    setRequestHandler(schema: { method: string }, handler: Function) {
      handlerRegistry.set(schema.method, handler);
    }
  },
}));

vi.mock('@modelcontextprotocol/sdk/types.js', () => ({
  ListToolsRequestSchema: { method: 'tools/list' },
  CallToolRequestSchema: { method: 'tools/call' },
}));

describe('McpService', () => {
  beforeEach(() => {
    handlerRegistry.clear();
  });

  it('should expose registered tools even when they are registered before server init', async () => {
    const service = new McpService();
    service.registerTools(
      new Map([
        [
          'inspect_project',
          {
            handler: vi.fn(),
            options: {
              name: 'inspect_project',
              description: 'Inspect project files',
              schema: z.object({}),
            },
          },
        ],
      ]),
    );

    await service.onModuleInit();

    const listToolsHandler = handlerRegistry.get('tools/list');
    expect(listToolsHandler).toBeTypeOf('function');

    const response = await listToolsHandler?.({ method: 'tools/list' });
    expect(response).toEqual({
      tools: [
        expect.objectContaining({
          name: 'inspect_project',
          description: 'Inspect project files',
        }),
      ],
    });
  });

  it('should execute a registered tool through the MCP call handler', async () => {
    const toolHandler = vi.fn().mockResolvedValue({ ok: true });
    const service = new McpService();
    service.registerTools(
      new Map([
        [
          'course_search',
          {
            handler: toolHandler,
            options: {
              name: 'course_search',
              description: 'Search courses',
              schema: z.object({
                keyword: z.string(),
              }),
            },
          },
        ],
      ]),
    );

    await service.onModuleInit();

    const callToolHandler = handlerRegistry.get('tools/call');
    const response = await callToolHandler?.({
      params: {
        name: 'course_search',
        arguments: { keyword: 'HSK' },
      },
    });

    expect(toolHandler).toHaveBeenCalledWith({ keyword: 'HSK' });
    expect(response).toEqual({
      content: [{ type: 'text', text: JSON.stringify({ ok: true }) }],
    });
  });
});
