import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { McpTool } from './mcp.decorators';
import { PrismaService } from '../common/services/prisma.service';

const SENSITIVE_FILE_NAMES = new Set([
  '.env',
  '.env.local',
  '.env.production',
  '.env.production.local',
  'id_rsa',
  'id_ed25519',
]);
const MAX_READ_BYTES = 200_000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

@Injectable()
export class McpCoreSkillsService {
  private readonly logger = new Logger(McpCoreSkillsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getRootPath(): string {
    return path.resolve(this.configService.get<string>('MCP_PROJECT_ROOT') || process.cwd());
  }

  private resolveSafePath(relativePath?: string) {
    const rootPath = this.getRootPath();
    const targetPath = path.resolve(rootPath, relativePath ?? '.');
    const relative = path.relative(rootPath, targetPath);
    const isInsideRoot =
      relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));

    if (!isInsideRoot) {
      return { error: 'Access denied: path is outside the configured project root.' };
    }

    const fileName = path.basename(targetPath);
    if (SENSITIVE_FILE_NAMES.has(fileName) || fileName.startsWith('.env.')) {
      return { error: 'Access denied: sensitive files cannot be read through MCP.' };
    }

    return { targetPath };
  }

  private async getTenantScope() {
    const tenantId = this.configService.get<string>('MCP_TENANT_ID');
    if (!tenantId) {
      return { error: 'MCP_TENANT_ID is required for tenant-scoped data tools.' };
    }

    const tenant = await this.prismaService.tenant.findFirst({
      where: {
        id: tenantId,
        isActive: true,
      },
      select: { id: true },
    });

    if (!tenant) {
      return { error: 'Configured MCP_TENANT_ID does not match an active tenant.' };
    }

    return { tenantId: tenant.id };
  }

  @McpTool({
    name: 'inspect_project',
    description: 'List files and folders under the configured MCP project root.',
    schema: z.object({
      path: z.string().optional().describe('Relative folder path to inspect.'),
    }),
  })
  async inspectProject(args: { path?: string }) {
    const resolved = this.resolveSafePath(args.path);
    if (resolved.error || !resolved.targetPath) {
      return { error: resolved.error };
    }

    try {
      const items = fs.readdirSync(resolved.targetPath, { withFileTypes: true });
      return items.map((item) => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file',
      }));
    } catch (error: unknown) {
      return { error: `Cannot read directory: ${getErrorMessage(error)}` };
    }
  }

  @McpTool({
    name: 'course_search',
    description: 'Search courses in the LMS database.',
    schema: z.object({
      keyword: z.string().describe('Course title keyword.'),
    }),
  })
  async searchCourses(args: { keyword: string }) {
    try {
      const tenantScope = await this.getTenantScope();
      if (tenantScope.error || !tenantScope.tenantId) {
        return { error: tenantScope.error };
      }

      return this.prismaService.course.findMany({
        where: {
          tenantId: tenantScope.tenantId,
          title: {
            contains: args.keyword,
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
    } catch (error: unknown) {
      this.logger.error(`Course search failed: ${getErrorMessage(error)}`);
      return { error: 'Cannot search courses right now.' };
    }
  }

  @McpTool({
    name: 'read_file_content',
    description: 'Read a non-sensitive file under the configured MCP project root.',
    schema: z.object({
      path: z.string().describe('Relative file path to read.'),
    }),
  })
  async readFileContent(args: { path: string }) {
    const resolved = this.resolveSafePath(args.path);
    if (resolved.error || !resolved.targetPath) {
      return { error: resolved.error };
    }

    try {
      const stat = fs.statSync(resolved.targetPath);
      if (stat.isDirectory()) {
        return { error: 'Path points to a directory. Use inspect_project instead.' };
      }
      if (stat.size > MAX_READ_BYTES) {
        return { error: 'File is too large to read through MCP.' };
      }

      return {
        path: args.path,
        content: fs.readFileSync(resolved.targetPath, 'utf-8'),
      };
    } catch (error: unknown) {
      return { error: `Cannot read file: ${getErrorMessage(error)}` };
    }
  }
}
