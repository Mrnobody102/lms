---
name: lms_platform_skills
description: Tập hợp các kỹ năng để tương tác với hệ thống LMS thông qua MCP Server.
---

# LMS Platform Skills

Kỹ năng này cho phép AI Agent tương tác với hệ thống LMS (Learning Management System).
Nó cung cấp các khả năng như:

- Tìm kiếm khóa học và bài học.
- Quản lý ghi danh và báo cáo người dùng.
- Kiểm tra cấu trúc hệ thống.

## Hướng dẫn sử dụng

1. Đảm bảo MCP Server của LMS đang chạy tại `http://localhost:3000/mcp/sse`.
2. Khi kết nối, bạn **PHẢI** gửi API Key thông qua:
   - Header: `x-api-key: <your_key>`
   - Hoặc Query Param: `?apiKey=<your_key>` (Dành cho SSE connection ban đầu).
3. Sử dụng các Tools được liệt kê trong danh sách MCP Tools để thực hiện yêu cầu của người dùng.
4. Luôn validate kết quả trả về trước khi phản hồi cho người dùng.

## Các lệnh chính

- `inspect_project`: Giúp bạn hiểu cấu trúc mã nguồn của LMS.
- `course_search`: Tìm kiếm thông tin khóa học từ Database thực tế.
- `read_file_content`: Đọc nội dung code để hỗ trợ debug và phát triển.

## Kỹ năng Chuyên gia (Specialized Skills)

Khi thực hiện các tác vụ chuyên sâu, bạn **PHẢI** tham khảo các bộ quy chuẩn bổ sung sau:

1. **API Design Reviewer**: [agent-knowledge/skills/api-design-reviewer/SKILL.md](../skills/api-design-reviewer/SKILL.md)
   - Dùng khi thiết kế endpoint mới hoặc review code Controller.
2. **MCP Server Builder**: [agent-knowledge/skills/mcp-server-builder/SKILL.md](../skills/mcp-server-builder/SKILL.md)
   - Dùng khi cần mở rộng thêm các kỹ năng MCP mới cho hệ thống.
3. **API Test Suite Builder**: [agent-knowledge/skills/test-suite-builder/SKILL.md](../skills/test-suite-builder/SKILL.md)
   - Dùng để tự động tạo Unit/Integration Test cho API Server.
4. **Database Intelligence**: [agent-knowledge/skills/db-intelligence/SKILL.md](../skills/db-intelligence/SKILL.md)
   - Dùng khi cần review schema, lập kế hoạch migration hoặc thay đổi Database.
