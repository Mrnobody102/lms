# Senior Frontend Engineer

**Tier:** POWERFUL
**Category:** Engineering / Frontend
**Domain:** React / Next.js / TypeScript
**Maintainer:** LMS Agent Team

---

## Overview

Frontend development skill for the LMS Platform. Covers Next.js 16 App Router, React Server Components, TypeScript, Tailwind CSS, Zustand state management, and next-intl internationalization. Use when building student portals, admin dashboards, or shared UI components.

---

## Core Capabilities

- **RSC optimization**: utilizing React Server Components for better performance and smaller client-side bundles
- **App Router mastery**: complex layouts, nested routing, dynamic segments, parallel routes
- **State management**: Zustand for global client-side state with localStorage persistence
- **i18n integration**: seamless `next-intl` for Vietnamese and English support
- **Component patterns**: atomic design, feature-driven organization, shared UI components
- **Performance**: `next/image`, code splitting, streaming, Suspense boundaries

---

## When to Use

Use when:

- Building or modifying pages in `apps/web-admin` or `apps/web-student`
- Creating React components (UI, layout, feature)
- Adding or updating translations
- Optimizing frontend performance or bundle size
- Reviewing frontend code quality

Skip when:

- Working on the NestJS backend (`apps/api-server`)
- Writing database migrations or Prisma schema changes
- API endpoint design or review

---

## Key Workflows

### 1. Create a New Page

1. Determine if it needs `locale` segment (most pages do)
2. Choose Server or Client Component based on data/interactivity needs
3. Set up page file: `app/[locale]/path/page.tsx`
4. Add loading/error boundaries: `loading.tsx`, `error.tsx`
5. Add translations in `src/messages/vi.json` and `src/messages/en.json`
6. Register route in `src/navigation.ts` for i18n-aware navigation

### 2. Create a New Component

1. Place in `src/components/ui/` (shared) or `src/features/X/components/` (feature-specific)
2. Default to Server Component; add `'use client'` only when needed
3. Use `lucide-react` for icons
4. Use `next/image` for images
5. Add TypeScript types for all props

### 3. Add Translations

1. Add key to both `vi.json` and `en.json` simultaneously
2. Use hierarchical keys: `Course.detail.lessonCount`
3. Variables: `t("key", { count: 5 })`
4. Server component: `getMessages()` + `setRequestLocale()`
5. Client component: `useTranslations("Scope")`

---

## Common Pitfalls

| Pitfall                                          | Fix                                                                  |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Using `'use client'` unnecessarily               | Default to Server Components; only add directive when needed         |
| Hardcoded URLs in navigation                     | Use `src/navigation.ts` exports (`Link`, `usePathname`, `useRouter`) |
| Forgetting to update both translation files      | Always update `vi.json` AND `en.json` together                       |
| Missing `loading.tsx` / `error.tsx`              | Add for all main routes to prevent blank screens                     |
| Importing `next/link` instead of i18n-aware Link | Always import `Link` from `src/navigation.ts`                        |
| Large client bundles from heavy imports          | Use `next/dynamic` or `next/image` for lazy loading                  |
| Storing sensitive data in Zustand localStorage   | Never store passwords or JWTs; persist only safe UX state            |

---

## Best Practices

1. **Server Components first**: Start with a Server Component and extract client islands as needed
2. **Zustand for global state**: `src/features/auth/auth.store.ts` for auth; create separate stores per feature
3. **Tailwind for layouts, CSS for components**: Use `clsx`/`cn()` utility for conditional classes
4. **Lucide-react icons only**: No emoji, no custom icon SVGs inline
5. **TypeScript strict mode**: No `any` types; define interfaces for all data shapes
6. **Accessible markup**: Semantic HTML (`<button>`, `<nav>`, `<main>`), ARIA labels where needed
7. **Responsive design**: Mobile-first with Tailwind breakpoints (`sm:`, `md:`, `lg:`)

---

## Related Skills

| Skill            | Use When                                    |
| ---------------- | ------------------------------------------- |
| nextjs-standards | Detailed Next.js patterns and configuration |
| i18n-workflow    | Managing translations across the monorepo   |
| auth-standards   | Zustand auth store and JWT handling         |
| testing-strategy | Unit tests for React components             |
| playwright-pro   | End-to-end testing of frontend flows        |

---

## Reference Documentation

→ See `references/` directory for React patterns, Next.js optimization guide, and Tailwind utility reference.
