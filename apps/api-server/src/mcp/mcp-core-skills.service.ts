import { Injectable, Logger } from "@nestjs/common";
import { McpTool } from "./mcp.decorators";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class McpCoreSkillsService {
  private readonly logger = new Logger(McpCoreSkillsService.name);

  @McpTool({
    name: "inspect_project",
    description:
      "Hiển thị cấu trúc thư mục của dự án LMS để AI Agent hiểu ngữ cảnh mã nguồn.",
    schema: z.object({
      path: z
        .string()
        .optional()
        .describe("Đường dẫn thư mục cần kiểm tra (mặc định là root)"),
    }),
  })
  async inspectProject(args: { path?: string }) {
    const rootPath = path.resolve(process.cwd(), "../../");
    const targetPath = args.path ? path.join(rootPath, args.path) : rootPath;

    try {
      const items = fs.readdirSync(targetPath, { withFileTypes: true });
      return items.map((item) => ({
        name: item.name,
        type: item.isDirectory() ? "directory" : "file",
      }));
    } catch (error) {
      return { error: `Không thể đọc thư mục: ${error.message}` };
    }
  }

  @McpTool({
    name: "course_search",
    description: "Tìm kiếm các khóa học trong hệ thống LMS theo từ khóa.",
    schema: z.object({
      keyword: z.string().describe('Từ khóa tìm kiếm (ví dụ: "AI", "React")'),
    }),
  })
  async searchCourses(args: { keyword: string }) {
    // Mock data cho giai đoạn demo
    const mockCourses = [
      { id: 1, title: "Lập trình AI với Python", category: "AI" },
      { id: 2, title: "Phát triển Frontend React chuyên sâu", category: "Web" },
      { id: 3, title: "Học máy cơ bản", category: "AI" },
    ];

    return mockCourses.filter((c) =>
      c.title.toLowerCase().includes(args.keyword.toLowerCase()),
    );
  }
}
