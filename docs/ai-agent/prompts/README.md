# AI Agent Prompt Templates

Prompt templates chuẩn cho các tác vụ thường gặp với AI coding agents. Mỗi prompt được thiết kế để trigger đúng skill files từ `agent-knowledge/skills/`.

## Danh Sách Prompt Templates

| Template          | File                                         | Mô tả                                                                       |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| Full System Audit | [full-system-audit.md](full-system-audit.md) | Audit + remediation + verification theo phase gate cho toàn bộ LMS Platform |

## Cách Sử Dụng

1. Chọn template phù hợp với tác vụ.
2. Copy nội dung prompt từ file template.
3. Tùy chỉnh phần `Scope` và `Acceptance Criteria` nếu cần.
4. Paste vào AI coding agent (Claude Code, Cursor, Copilot, Gemini, v.v.).

## Quy Tắc Khi Tạo Prompt Mới

- Luôn bắt đầu với phần **Context Loading** trỏ đến `AGENTS.md` và relevant skills.
- Định nghĩa rõ **Goal**, **Scope**, **Acceptance Criteria**.
- Thêm **Safety Rules** để ngăn agent thực hiện hành động nguy hiểm.
- Thêm **Validation** section với các lệnh kiểm tra cụ thể.
- Sử dụng **Handoff Format** chuẩn từ `AGENTS.md`.
