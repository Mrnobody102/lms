# Công Nghệ Sử Dụng (Technology Stack)

## Mục Lục

- [Core](#core)
- [Backend (`apps/api-server`)](#backend-appsapi-server)
- [Frontend (`apps/web-*`)](#frontend-appsweb-)
- [DevOps & Infrastructure (DevOps & Hạ tầng) - Dự kiến](#devops--infrastructure-devops--hạ-tầng---dự-kiến)

## Core

- **Monorepo Tool**: [Turborepo](https://turbo.build/) - Hệ thống build hiệu năng cao.
- **Package Manager**: [pnpm](https://pnpm.io/) - Nhanh, tiết kiệm dung lượng ổ cứng.
- **Language**: [TypeScript](https://www.typescriptlang.org/) - An toàn kiểu dữ liệu từ đầu đến cuối (End-to-end type safety).

## Backend (`apps/api-server`)

- **Framework**: [NestJS](https://nestjs.com/) - Framework Node.js có khả năng mở rộng cao (Modular, DI).
- **ORM**: [Prisma](https://www.prisma.io/) - Database client an toàn kiểu dữ liệu.
- **Database**: PostgreSQL.
- **Authentication**: Passport.js + JWT.
- **Validation**: `class-validator` + `class-transformer`.
- **API Documentation**: Swagger (`@nestjs/swagger`).
- **Security & Performance**: `helmet`, `compression`, `@nestjs/throttler` (Rate Limiting).
- **Queues**: Bull (Redis) - _Dự kiến dùng cho xử lý video_.

## Frontend (`apps/web-*`)

- **Framework**: [Next.js](https://nextjs.org/) (App Router) - React framework (SSR/SSG).
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS.
- **Component Library**: [shadcn/ui](https://ui.shadcn.com/) - Các components tái sử dụng được xây dựng trên Radix UI.
- **State Management**:
  - Server State: [TanStack Query](https://tanstack.com/query) - Caching, đồng bộ hóa dữ liệu.
  - Client State: [Zustand](https://docs.pmnd.rs/zustand) - Quản lý global state nhẹ nhàng.
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/).

### Mobile App (Chiến Lược Tương Lai)

- **Framework**: **React Native (Expo)**.
  - _Lý do_: Tận dụng được tối đa code logic đã viết bằng TypeScript trong Monorepo (các gói `packages/shared`, `packages/api-client`). Đội ngũ dev frontend (React/Next.js) có thể dễ dàng tham gia phát triển.
- **Kiến trúc**:
  - **API-First**: Mobile App sẽ gọi chung hệ thống API (Rest/GraphQL) với Web App.
  - **Shared State**: Có thể dùng chung các hook data-fetching (TanStack Query) nếu cấu trúc code tốt.
- **Tính năng đặc thù**:
  - Push Notifications (thông báo lịch học, bài tập).
  - Offline Mode (tải bài học về học offline).
  - Audio/Microphone integrate (luyện phát âm tiếng Trung).

## DevOps & Infrastructure (DevOps & Hạ tầng) - Dự kiến

- **Containerization**: Docker.
- **CI/CD**: GitHub Actions.
- **Hosting**: Vercel (Frontend), AWS/Render (Backend).
- **Storage**: AWS S3 (Lưu trữ Video bài giảng).
