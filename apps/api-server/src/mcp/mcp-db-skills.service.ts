import { Injectable, Logger } from "@nestjs/common";
import { McpTool } from "./mcp.decorators";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class McpDbSkillsService {
  private readonly logger = new Logger(McpDbSkillsService.name);
  private readonly schemaPath = path.resolve(
    process.cwd(),
    "../../packages/database/prisma/schema.prisma",
  );

  @McpTool({
    name: "db_schema_review",
    description:
      "Đọc và phân tích cấu trúc Database hiện tại từ file Prisma Schema.",
    schema: z.object({}),
  })
  async reviewSchema() {
    try {
      if (!fs.existsSync(this.schemaPath)) {
        return { error: `Không tìm thấy file schema tại: ${this.schemaPath}` };
      }
      const content = fs.readFileSync(this.schemaPath, "utf-8");

      // Phân tích sơ bộ
      const models =
        content.match(/model\s+(\w+)\s+{/g)?.map((m) => m.split(/\s+/)[1]) ||
        [];
      const enums =
        content.match(/enum\s+(\w+)\s+{/g)?.map((m) => m.split(/\s+/)[1]) || [];

      return {
        path: "packages/database/prisma/schema.prisma",
        content: content,
        analysis: {
          modelCount: models.length,
          models: models,
          enumCount: enums.length,
          enums: enums,
        },
      };
    } catch (error: any) {
      return { error: `Lỗi khi đọc schema: ${error.message}` };
    }
  }

  @McpTool({
    name: "generate_migration_plan",
    description:
      "Đề xuất kế hoạch thay đổi Database (Prisma models) dựa trên yêu cầu.",
    schema: z.object({
      intent: z
        .string()
        .describe(
          "Mô tả thay đổi bạn muốn thực hiện (ví dụ: 'Thêm field category vào Course')",
        ),
      targetModel: z.string().optional().describe("Tên model cần thay đổi"),
    }),
  })
  async generateMigrationPlan(_args: { intent: string; targetModel?: string }) {
    // Công cụ này chủ yếu trả về hướng dẫn để AI Agent tự suy luận và đề xuất code cho User
    return {
      instructions: "Dựa trên intent của bạn, hãy thực hiện các bước sau:",
      steps: [
        "1. Chạy db_schema_review để lấy code hiện tại của model.",
        "2. Đề xuất đoạn code Prisma mới cho User trong khung chat.",
        "3. Sau khi User đồng ý, hướng dẫn User chạy lệnh: 'pnpm db:migrate --name <ten_migration>' hoặc 'pnpm db:push'.",
      ],
      safety_check:
        "CẢNH BÁO: Nếu thay đổi này xóa cột hoặc đổi kiểu dữ liệu, hãy hỏi xác nhận User về việc bảo toàn dữ liệu cũ.",
    };
  }
}
