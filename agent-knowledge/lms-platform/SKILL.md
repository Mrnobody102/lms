# LMS Platform - Skills

**Tier:** SKILL INDEX
**Category:** Agent Skills
**Maintainer:** LMS Agent Team

---

## Overview

Danh sách các kỹ năng (Skills) mà AI Agent sử dụng để thực hiện tác vụ trong LMS Platform. Mỗi skill được thiết kế theo phương pháp BMAD.

## Core Skills

| Skill                  | Mô tả                                    |
| ---------------------- | ---------------------------------------- |
| `architecture-core`    | Hiểu app boundaries và monorepo layout   |
| `auth-standards`       | Implement login, registration, JWT flow  |
| `database-operations`  | Chạy migrations, seeding, Prisma changes |
| `db-intelligence`      | Planning schema changes an toàn          |
| `nestjs-standards`     | Building API endpoints với NestJS        |
| `nextjs-standards`     | Building frontend pages và components    |
| `i18n-workflow`        | Thêm hoặc cập nhật translations          |
| `testing-strategy`     | Viết unit và integration tests           |
| `test-suite-builder`   | Tạo API test scaffolds                   |
| `engineering-planning` | Lên kế hoạch features hoặc refactors     |
| `deployment-ops`       | Dockerizing hoặc setup CI/CD             |
| `api-design-reviewer`  | Thiết kế hoặc review API endpoints       |
| `mcp-server-builder`   | Build MCP tools từ API contracts         |

## Usage

Khi AI Agent nhận yêu cầu, hãy:

1. Load `CONTEXT.md` để hiểu ngữ cảnh dự án
2. Load skill phù hợp từ `skills/` directory
3. Thực hiện tác vụ theo hướng dẫn trong skill
4. Reference `docs/` cho tài liệu chi tiết

## Quick References

- **API Docs**: `docs/api-documentation.md`
- **Architecture**: `docs/ARCHITECTURE.md`
- **Tech Stack**: `docs/tech-stack.md`
- **Quick Start**: `docs/quick-start.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`
