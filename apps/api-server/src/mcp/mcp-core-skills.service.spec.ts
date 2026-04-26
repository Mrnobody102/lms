import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpCoreSkillsService } from './mcp-core-skills.service';

describe('McpCoreSkillsService', () => {
  let prismaService: {
    tenant: { findFirst: ReturnType<typeof vi.fn> };
    course: { findMany: ReturnType<typeof vi.fn> };
  };
  let configService: {
    get: ReturnType<typeof vi.fn>;
  };
  let service: McpCoreSkillsService;

  beforeEach(() => {
    prismaService = {
      tenant: {
        findFirst: vi.fn(),
      },
      course: {
        findMany: vi.fn(),
      },
    };
    configService = {
      get: vi.fn(),
    };
    service = new McpCoreSkillsService(prismaService as never, configService as never);
  });

  it('should reject tenant-scoped data access when MCP_TENANT_ID is missing', async () => {
    configService.get.mockReturnValue(undefined);

    await expect(service.searchCourses({ keyword: 'HSK' })).resolves.toEqual({
      error: 'MCP_TENANT_ID is required for tenant-scoped data tools.',
    });
    expect(prismaService.course.findMany).not.toHaveBeenCalled();
  });

  it('should scope course search to the configured active tenant', async () => {
    configService.get.mockReturnValue('550e8400-e29b-41d4-a716-446655440000');
    prismaService.tenant.findFirst.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    prismaService.course.findMany.mockResolvedValue([{ id: 'course-1', title: 'HSK 1' }]);

    await expect(service.searchCourses({ keyword: 'HSK' })).resolves.toEqual([
      { id: 'course-1', title: 'HSK 1' },
    ]);
    expect(prismaService.course.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: '550e8400-e29b-41d4-a716-446655440000',
        title: {
          contains: 'HSK',
          mode: 'insensitive',
        },
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        title: true,
      },
    });
  });
});
