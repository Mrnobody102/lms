# Kiến Trúc AI Agent Hiện Đại: Từ Tự Động Hóa Đến Tự Vận Hành (Autonomous)

Tài liệu này trình bày kiến trúc và lộ trình phát triển hệ thống AI Agent tại **LMS Platform**. Đây là mô hình được thiết kế theo các tiêu chuẩn kỹ nghệ AI tiên tiến nhất của năm **2026**, hướng tới khả năng tự vận hành hoàn toàn (Self-working/Autonomous) - đỉnh cao của công nghệ Agentic hiện nay.

---

## 1. Triết Lý Thiết Kế (The "Ultimate" Blueprint)

Một hệ thống AI Agent hiện đại không chỉ là một chat-bot đơn thuần, mà là một **"Nhân viên số" (Digital Coworker)** có khả năng hiểu ngữ cảnh, lập kế hoạch, hành động và tự kiểm định. Kiến trúc của chúng tôi dựa trên 4 cột trụ (4 Pillars):

1.  **Perception & Connectivity (Hệ thần kinh):** Sử dụng giao thức **MCP (Model Context Protocol)** để kết nối Agent với dữ liệu và hệ thống thực tế một cách an toàn.
2.  **Reasoning & Modular Skills (Bộ não):** Áp dụng phương pháp **BMAD** và chuẩn **Agent Skills (SKILL.md)** để cung cấp kiến thức chuyên gia theo dạng module, giúp AI không bị tràn bộ nhớ context.
3.  **Action & Execution (Đôi bàn tay):** Cho phép AI thực thi các tác vụ thực tế (đọc code, gọi API, thao tác Database) thông qua bộ MCP Tools động.
4.  **Quality & Immunity (Hệ miễn dịch):** Thiết lập các **Validation Gates (Local CI)** giúp AI tự kiểm tra kết quả công việc (Lint, Test, Build) trước khi bàn giao.

---

## 2. Hạ Tầng Kỹ Thuật (Infrastructure)

### Model Context Protocol (MCP) - Giao thức Chuẩn hóa

Chúng tôi sử dụng MCP để xóa bỏ rào cản giữa AI và mã nguồn.

- **Transport**: SSE (Server-Sent Events) - cho phép kết nối ổn định và hai chiều giữa Cloud AI và Local System.
- **Discovery**: Cơ chế Decorator (@McpTool) giúp mở rộng kỹ năng AI chỉ trong vài giây.
- **Security**: Bảo mật lớp kép với `McpAuthGuard` (API Key) và cơ chế Rate-limiting, đảm bảo AI chỉ hoạt động trong phạm vi an toàn.

### Hệ Thống Quản Lý Tri Thức (Agent Knowledge)

Toàn bộ "kinh nghiệm" của hệ thống được lưu trữ trong thư mục `agent-knowledge/`:

- **Context Layer (`CONTEXT.md`)**: Bản đồ nghiệp vụ, giúp AI hiểu "Tại sao chúng ta làm như vậy?".
- **Skill Layer (`SKILL.md`)**: Hướng dẫn chuyên môn cho từng module (API, UI, Testing, DB).
- **Expert Skills**: Tích hợp các bộ kỹ năng từ cộng đồng quốc tế (Claude-Skills) để AI có tư duy của một kỹ sư senior.

---

## 3. Những Gì Chúng Tôi Đã Làm (The "Agentic" Foundation)

Hệ thống hiện tại đã đạt được các cột mốc quan trọng:

- **Real-Data Connection**: AI có thể truy vấn trực tiếp Course/User từ Database thông qua Prisma.
- **Automated Testing**: AI tự động viết Unit Test cho chính mã nguồn nó tạo ra bằng Vitest + SWC.
- **Database Intelligence**: Agent có khả năng review Prisma Schema và đề xuất kế hoạch migration an toàn, tránh mất mát dữ liệu.
- **Self-validation**: Tích hợp script `validate-ai-work.ps1` để AI tự chạy Lint/Test/Build trước khi kết thúc tác vụ.

---

## 4. Lộ Trình Tiến Tới Hệ Thống Tự Vận Hành (Long-term Roadmap)

Để đạt được đẳng cấp của một hệ sinh thái **Autonomous AI Agent**, chúng tôi đang triển khai các giai đoạn tiếp theo:

### Giai đoạn 1: Lập Kế Hoạch Tự Chủ (Autonomous Planning)

- **Mục tiêu**: AI không cần User cung cấp Task List chi tiết.
- **Cách làm**: Chỉ từ một yêu cầu cao cấp (ví dụ: "Thêm tính năng đăng ký khóa học"), AI sẽ tự suy luận ra `implementation_plan.md`, phân tích tầm ảnh hưởng và tự chia nhỏ công việc.

### Giai đoạn 2: Vòng Lặp Tự Sửa Lỗi (Self-healing Loops)

- **Mục tiêu**: AI tự debug cho đến khi code hoàn hảo.
- **Cách làm**: Nếu script validate thất bại, AI sẽ tự đọc Error Logs, suy luận nguyên nhân, sửa mã nguồn và chạy lại script một cách tuần hoàn (Agentic Reasoning) cho đến khi PASS.

### Giai đoạn 3: Điều Phối Đa Tác Nhân (Multi-Agent Orchestration)

- **Mục tiêu**: Chuyên môn hóa cao độ.
- **Cách làm**: Chia hệ thống thành các Sub-Agents chuyên trách:
  - **Architect Agent**: Thiết kế cấu trúc.
  - **Coder Agent**: Viết mã.
  - **Tester Agent**: Viết và chạy test.
  - **Security Agent**: Quét lỗ hổng bảo mật.
    Các agent này sẽ phối hợp và review chéo công việc của nhau.

### Giai đoạn 4: Bộ Nhớ Dài Hạn (Long-term Memory & Context Awareness)

- **Mục tiêu**: AI hiểu lịch sử dự án như một nhân viên làm việc lâu năm.
- **Cách làm**: Sử dụng Vector Database hoặc cơ chế Knowledge Graph để AI lưu trữ các quyết định kiến trúc cũ, các lỗi đã từng gặp và các pattern code đặc thù của dự án.

---

## 5. Hướng Dẫn Áp Dụng Cho Các Hệ Thống Khác

Nếu bạn muốn xây dựng một AI Agent chuẩn nhất hiện nay, hãy đi theo quy trình:

1.  **Cài đặt MCP Server** làm cổng kết nối dữ liệu.
2.  **Đóng gói tri thức** vào các file Markdown thay vì hard-code vào prompt.
3.  **Tạo các "Safety Gates"** để AI không thể làm hỏng code-base.
4.  **Tư duy theo hướng Task-Action-Verify**: Luôn yêu cầu AI kiểm tra lại những gì nó vừa làm.

---

_Tài liệu này là bản tuyên ngôn về kiến trúc hướng AI của chúng tôi, liên tục được cập nhật để phản ánh những tiến bộ mới nhất trong ngành công nghiệp AI Agent._
