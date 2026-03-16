# Tài liệu Hạ tầng AI Agent - LMS Platform

Hệ thống AI Agent của LMS Platform được xây dựng trên sự kết hợp của 3 tiêu chuẩn hiện đại nhất: **MCP (Model Context Protocol)**, **BMAD (Business Modular AI Development)**, và **Agent Skills (SKILL.md)**.

## 1. Kiến trúc Tổng thể (Architecture)

Hệ thống hoạt động theo mô hình Client-Server thông qua giao thức MCP:

- **Server**: NestJS (api-server) đóng vai trò là MCP Server.
- **Transport**: Server-Sent Events (SSE) để truyền tin hai chiều thời gian thực.
- **AI Agent**: (Claude Desktop, OpenClaw, v.v.) đóng vai trò MCP Client.

## 2. Các thành phần kỹ thuật

### Model Context Protocol (MCP)

- **Endpoint**: `/api/mcp/sse` (GET) và `/api/mcp/messages` (POST).
- **Service**: `McpService` quản lý vòng đời Server và JSON-RPC handlers.
- **Controller**: `McpController` quản lý luồng dữ liệu SSE.

### Cơ chế Auto-Discovery (Decorators)

Để thêm một kỹ năng mới cho AI, lập trình viên chỉ cần sử dụng decorator:

```typescript
@McpTool({
  name: 'tên_kỹ_năng',
  description: 'mô tả cho AI hiểu',
  schema: z.object({ ... })
})
async myAwesomeSkill(args: any) { ... }
```

`McpRegistryService` sẽ tự động quét và đăng ký các kỹ năng này khi khởi động ứng dụng.

## 3. Phương pháp BMAD (Business Context)

BMAD được áp dụng để giải quyết vấn đề mất ngữ cảnh (Context Loss) của AI:

- **Context Files**: `agent-knowledge/lms-platform/CONTEXT.md` chứa toàn bộ logic nghiệp vụ về Tenant, Roles và Rules.
- **Modular Knowledge**: Kiến thức được chia nhỏ theo từng folder, giúp Agent không bị tràn bộ nhớ context (Brain memory).

## 4. Tích hợp AI Agent (OpenClaw/Agent Skills)

Toàn bộ "kỹ năng" và "kiến thức" được đóng gói trong thư mục `agent-knowledge/`:

- `SKILL.md`: Định danh bộ kỹ năng và hướng dẫn AI cách kết nối tới MCP Server.
- `CONTEXT.md`: Cung cấp bản đồ nghiệp vụ.

## 5. Hướng dẫn Mở rộng (Scaling)

1. **Thêm Skill**: Tạo một service method mới, gắn `@McpTool`.
2. **Thêm Resource**: Sử dụng `@McpResource` (nếu cần chia sẻ dữ liệu tĩnh).
3. **Cập nhật Context**: Khi có nghiệp vụ mới, hãy bổ sung vào `CONTEXT.md` để AI luôn "thông minh" đúng lúc.

---

_Tài liệu này được tạo ra để phục vụ việc tham khảo và bảo trì hệ thống AI-Agent cho LMS Platform._
