import { Injectable, Logger } from "@nestjs/common";
import { McpTool } from "./mcp.decorators";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { PrismaService } from "../common/services/prisma.service";

@Injectable()
export class McpCoreSkillsService {
  private readonly logger = new Logger(McpCoreSkillsService.name);

  constructor(private readonly prismaService: PrismaService) {}

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
    } catch (error: any) {
      return { error: `Không thể đọc thư mục: ${error.message}` };
    }
  }

  @McpTool({
    name: "course_search",
    description:
      "Tìm kiếm các khóa học trong hệ thống LMS từ Database thực tế.",
    schema: z.object({
      keyword: z
        .string()
        .describe('Từ khóa tìm kiếm tiêu đề khóa học (ví dụ: "AI", "React")'),
    }),
  })
  async searchCourses(args: { keyword: string }) {
    try {
      const courses = await this.prismaService.course.findMany({
        where: {
          title: {
            contains: args.keyword,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          title: true,
        },
      });
      return courses;
    } catch (error: any) {
      this.logger.error(`Lỗi khi tìm kiếm khóa học: ${error.message}`);
      return { error: "Không thể thực hiện tìm kiếm khóa học lúc này." };
    }
  }

  @McpTool({
    name: "read_file_content",
    description:
      "Đọc nội dung của một file cụ thể trong dự án để phân tích code.",
    schema: z.object({
      path: z.string().describe("Đường dẫn tương đối tới file cần đọc"),
    }),
  })
  async readFileContent(args: { path: string }) {
    const rootPath = path.resolve(process.cwd(), "../../");
    const targetPath = path.join(rootPath, args.path);

    // Bảo mật: Không cho phép đọc các file nhạy cảm ngoài monorepo
    if (!targetPath.startsWith(rootPath)) {
      return {
        error: "Truy cập bị từ chối: Đường dẫn nằm ngoài phạm vi dự án.",
      };
    }

    try {
      if (fs.statSync(targetPath).isDirectory()) {
        return {
          error: "Đường dẫn trỏ tới một thư mục, hãy dùng inspect_project.",
        };
      }
      const content = fs.readFileSync(targetPath, "utf-8");
      return {
        path: args.path,
        content: content,
      };
    } catch (error: any) {
      return { error: `Không thể đọc file: ${error.message}` };
    }
  }
}
