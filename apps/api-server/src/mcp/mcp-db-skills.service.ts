import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { McpTool } from './mcp.decorators';

@Injectable()
export class McpDbSkillsService {
  private readonly logger = new Logger(McpDbSkillsService.name);

  constructor(private readonly configService: ConfigService) {}

  private getSchemaPath(): string {
    const rootPath = path.resolve(
      this.configService.get<string>('MCP_PROJECT_ROOT') || process.cwd(),
    );
    return path.resolve(rootPath, 'packages/database/prisma/schema.prisma');
  }

  @McpTool({
    name: 'db_schema_review',
    description: 'Read and summarize the Prisma schema from the configured MCP project root.',
    schema: z.object({}),
  })
  async reviewSchema() {
    const schemaPath = this.getSchemaPath();

    try {
      if (!fs.existsSync(schemaPath)) {
        return { error: `Schema file was not found at: ${schemaPath}` };
      }

      const content = fs.readFileSync(schemaPath, 'utf-8');
      const models = content.match(/model\s+(\w+)\s+{/g)?.map((m) => m.split(/\s+/)[1]) || [];
      const enums = content.match(/enum\s+(\w+)\s+{/g)?.map((m) => m.split(/\s+/)[1]) || [];

      return {
        path: 'packages/database/prisma/schema.prisma',
        content,
        analysis: {
          modelCount: models.length,
          models,
          enumCount: enums.length,
          enums,
        },
      };
    } catch (error: any) {
      this.logger.error(`Schema review failed: ${error.message}`);
      return { error: `Cannot read schema: ${error.message}` };
    }
  }

  @McpTool({
    name: 'generate_migration_plan',
    description: 'Suggest a safe Prisma migration workflow for a requested schema change.',
    schema: z.object({
      intent: z.string().describe('Requested database change.'),
      targetModel: z.string().optional().describe('Target model name.'),
    }),
  })
  async generateMigrationPlan(_args: { intent: string; targetModel?: string }) {
    return {
      instructions: 'Use a migration-first workflow for database changes.',
      steps: [
        '1. Run db_schema_review to inspect the current Prisma schema.',
        '2. Propose the Prisma schema change and call out data-migration risks.',
        "3. For local development, create a migration with 'pnpm db:migrate --name <migration_name>'.",
        "4. For release and production, apply existing migrations with 'pnpm db:deploy'. Do not use db:push against production databases.",
      ],
      safety_check:
        'Ask for confirmation before destructive changes such as dropping columns, changing column types, or rewriting relation cardinality.',
    };
  }
}
