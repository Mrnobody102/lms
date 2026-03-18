---
name: LMS i18n Workflow
description: Procedures for managing internationalization using next-intl across the monorepo.
---

# LMS i18n Workflow Skill

Guidelines for adding and maintaining translations in `web-student` and `web-admin`.

## 1. Message Files

- Locations: `src/messages/vi.json` and `src/messages/en.json`.
- Structure: Hierarchical (e.g., `Student.auth.loginTitle`).

## 2. Adding Keys

- Always update BOTH `vi.json` and `en.json` simultaneously.
- Use descriptive keys.
- For variables, use `{bracket}` syntax: `t("duration", { minutes: 15 })`.

## 3. Hook Usage

- Client components: `useTranslations("Scope")`.
- Server components: `getMessages()` and `setRequestLocale()`.

## 4. Locale Routing

- Navigation: Use local `src/navigation.ts` exports (`Link`, `usePathname`, `useRouter`) instead of `next/link`.
- Middleware: Ensure `favicon.ico` and other static assets are excluded or exist in `public/` to prevent locale injection errors.
