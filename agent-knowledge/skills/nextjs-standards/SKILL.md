# NextJS Standards

**Tier:** POWERFUL
**Category:** Engineering / Frontend
**Domain:** LMS Web Portals (Admin & Student)
**Maintainer:** LMS Agent Team

---

## Overview

Guidelines for developing the LMS `web-admin` (Next.js 15 admin dashboard) and `web-student` (Next.js 15 student portal) applications. Both apps use the App Router, React Server Components, Zustand for auth state, Tailwind CSS with CSS variables, and `next-intl` for i18n.

## Core Capabilities

- **rsc_patterns**: Server Components for data fetching, Client Components only for interactivity.
- **app_router_layouts**: `[locale]` dynamic segment for i18n, nested layouts for admin sidebar.
- **zustand_auth**: `useAuthStore` in `features/auth/auth.store.ts` with localStorage persistence and JWT expiry checking.
- **tailwind_styling**: CSS variable-based design system (`hsl(var(--primary))`), rounded corners via `var(--radius)`, dark mode via `class` strategy.
- **i18n_integration**: `next-intl` with `[locale]` routing, `useTranslations`, `getMessages`, `setRequestLocale`.
- **lucide_icons**: All icons from `lucide-react` only.

## Project Structure

```
apps/web-admin/src/          apps/web-student/src/
  app/[locale]/                app/[locale]/
    layout.tsx                   layout.tsx
    page.tsx                     page.tsx
    login/page.tsx               login/page.tsx
    register/page.tsx            register/page.tsx
    courses/page.tsx             courses/page.tsx
    lessons/[id]/page.tsx        lessons/[id]/page.tsx
  features/                     features/
    auth/                        auth/
      auth.store.ts                auth.store.ts
      components/                  components/
        login-form.tsx               login-form.tsx
        register-form.tsx            register-form.tsx
  components/                   components/
  lib/                          lib/
    api.ts                        api.ts
packages/ui/src/               @repo/ui (shared ThemeProvider, styles.css)
```

## When to Use

Use when:
- Building new pages or components in `web-admin` or `web-student`.
- Adding Zustand state management for auth or UI state.
- Applying Tailwind classes or styling patterns.

Skip when:
- Working on the NestJS API server (use `nestjs-standards`).
- Writing tests (use `test-suite-builder` or `testing-strategy`).

## Server vs Client Components

| Use Server Component | Use Client Component ("use client") |
|---|---|
| Page-level data fetching | Forms with `useState` |
| Layout rendering | Auth state (useAuthStore) |
| Static content | Event handlers, onClick |
| `generateMetadata()` | useEffect hooks |
| | Interactivity (dropdowns, modals) |

Rule: Default to Server. Add `"use client"` only when you need hooks (`useState`, `useEffect`), browser APIs, or Zustand.

## Zustand Auth Store Pattern

```typescript
// features/auth/auth.store.ts
import { create } from "zustand";
import api from "../../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // ... initial state
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token, user, isAuthenticated: true, loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Login failed", loading: false });
      return false;
    }
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null, isAuthenticated: false });
  },
  checkAuth: () => {
    // Decode JWT payload, check expiry, restore state from localStorage
  },
}));
```

## API Client Pattern

Use the shared `api` instance from `lib/api.ts` which attaches `Authorization: Bearer <token>` header automatically via Axios interceptors. All API calls return `response.data` which is unwrapped to `{ success, data }`.

## Layout Patterns

Root layout uses async params pattern (Next.js 15):

```typescript
export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

## Tailwind Design System

Use CSS variable colors defined in `tailwind.config.ts`:

- `bg-primary`, `text-primary`, `bg-background`, `bg-card`, `bg-muted/30`
- Border: `border-border/50`, `focus:ring-primary/10`
- Glassmorphism: `bg-muted/30`, `backdrop-blur-xl`, `border-border/50`
- Radii: `rounded-2xl`, `rounded-xl`, `rounded-lg`
- Typography: `font-black`, `text-[11px] uppercase tracking-[0.15em]`

## Component Patterns

Login form uses `"use client"` with controlled inputs, error display, and loading state:

```typescript
"use client";
export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading, error, clearError } = useAuthStore();
  // ... form with lucide-react icons
}
```

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Using client features in Server Components | Add `"use client"` at the top of the file |
| Forgetting to `await params` in layouts | Next.js 15 requires `params: Promise<{ locale: string }>` |
| Storing tokens in plain state (lost on refresh) | Use localStorage with `checkAuth()` on mount |
| Missing `@repo/ui` in Tailwind content | Ensure `../../packages/ui/src/**/*.{js,ts,jsx,tsx}` is in content array |
| Mixing `lucide-react` with other icon libraries | Use only `lucide-react` |

## Best Practices

1. Default to Server Components; only add `"use client"` when needed.
2. Use `useTranslations("namespace")` for all UI strings (never hardcode Vietnamese text in components).
3. Use Tailwind CSS variable colors (`bg-primary`, `text-muted-foreground`) for theming.
4. Store auth token in `localStorage` and validate JWT expiry in `checkAuth()`.
5. Use `next/image` for all images to enable optimization.
6. Add `loading.tsx` and `error.tsx` for all main route segments.
7. Extract reusable UI into `packages/ui` for cross-app sharing.

## Related Skills

| Skill | Use When |
|---|---|
| nestjs-standards | Understanding API endpoint contracts |
| auth-standards | Auth flow between frontend and backend |
| i18n-workflow | Managing translation messages |

## Reference Documentation

-> See `references/nextjs-patterns.md` for deep-dive documentation on component patterns, Zustand store patterns, Tailwind glassmorphism patterns, and layout patterns.
