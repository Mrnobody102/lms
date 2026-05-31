# Công Nghệ Sử Dụng (Technology Stack)

## Mục Lục

- [Core](#core)
- [Backend (`apps/api-server`)](#backend-appsapi-server)
- [Frontend (`apps/web-*`)](#frontend-appsweb-)
- [Mobile (`apps/mobile-student`)](#mobile-appsmobile-student)
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

## Mobile (`apps/mobile-student`)

- **Framework**: React Native + Expo.
  - _Lý do_: Tận dụng TypeScript và các package shared trong monorepo, đồng thời có native capability cho push notification, offline cache, audio và microphone.
- **Phạm vi MVP**: student app trước; admin và super portal tiếp tục dùng web.
- **Kiến trúc**:
  - **API-first**: gọi chung NestJS API với web-student, ưu tiên các student contract hiện có như course activity, lesson, progress, practice/exam, SRS, roleplay và media.
  - **Client adapter**: `@repo/api-client` cần tách browser adapter và mobile adapter. Browser giữ cookie + CSRF; mobile dùng base URL rõ ràng, tenant resolver native và token/session trong secure storage.
  - **Shared logic**: dùng lại parser, DTO/types, query keys và learning helpers khi hợp lý; UI native viết riêng, không copy Radix/Tailwind web components.
  - **Tenant resolution**: mobile chọn tenant bằng tenant slug/domain/org code hoặc activation/license flow; không dùng hardcoded `NEXT_PUBLIC_TENANT_ID` trong production.
- **Feature order**:
  - M1: tenant selection, login/session restore, dashboard, continue learning, course activity timeline.
  - M2: lesson viewer cho text/video/quiz/micro-card, progress completion, SRS review.
  - M3: practice/exam attempt + review, audio prompt playback.
  - M4: roleplay text trước, audio/microphone sau khi production pronunciation provider ổn.
  - M5: push notification và offline-lite cache cho bài đã mở/SRS due.

## DevOps & Infrastructure (DevOps & Hạ tầng) - Dự kiến

- **Containerization**: Docker.
- **CI/CD**: GitHub Actions.
- **Hosting**: Vercel (Frontend), AWS/Render (Backend).
- **Storage**: AWS S3 (Lưu trữ Video bài giảng).
