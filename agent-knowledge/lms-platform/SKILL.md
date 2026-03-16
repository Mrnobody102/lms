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
2. Sử dụng các Tools được liệt kê trong danh sách MCP Tools để thực hiện yêu cầu của người dùng.
3. Luôn validate kết quả trả về trước khi phản hồi cho người dùng.

## Các lệnh chính

- `inspect_project`: Giúp bạn hiểu cấu trúc mã nguồn của LMS.
- `course_search`: Tìm kiếm thông tin khóa học theo từ khóa.
