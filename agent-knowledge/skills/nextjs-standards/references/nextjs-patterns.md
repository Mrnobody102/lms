# NextJS Patterns Reference

Deep-dive reference for Next.js 16 patterns used in the LMS web portals.

## Component Patterns

### Server Component (Default)

```typescript
// app/[locale]/courses/page.tsx
import { setRequestLocale } from "next-intl/server";
// Data fetching happens here, on the server

export default async function CoursesPage(props: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const courses = await fetchCourses();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### Client Component (Interactivity)

```typescript
// features/auth/components/login-form.tsx
"use client";

import { useState } from "react";
import { useAuthStore } from "../auth.store";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("Student");
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && onSuccess) onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl...">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}
      {/* ... form fields */}
    </form>
  );
}
```

## Zustand Store Patterns

### Auth Store Pattern

```typescript
// features/auth/auth.store.ts
import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    try {
      const response = await api.get('/users/me', { skipUnauthorizedRedirect: true });
      const user = response.data;
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isInitialized: true });
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data;
      localStorage.removeItem('token');
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true, loading: false });
      return true;
    } catch (error: any) {
      set({ error: error.response?.data?.message || 'Login failed', loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    set({ user: null, isAuthenticated: false });
  },
}));
```

In the actual LMS code, use `createAuthStore` from `@repo/shared` instead of copying this implementation. The session authority is the API-set HttpOnly cookie; localStorage is only a safe user cache.

### Feature Store Pattern

```typescript
// features/courses/course.store.ts
import { create } from 'zustand';

interface CourseFilters {
  search: string;
  category: string;
}

interface CourseState {
  filters: CourseFilters;
  setFilters: (filters: Partial<CourseFilters>) => void;
}

export const useCourseStore = create<CourseState>((set) => ({
  filters: { search: '', category: 'all' },
  setFilters: (newFilters) => set((state) => ({ filters: { ...state.filters, ...newFilters } })),
}));
```

## Tailwind Glassmorphism Patterns

### Card Component

```typescript
<div className="relative bg-muted/30 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
  {/* Content */}
</div>
```

### Input Fields

```typescript
<input
  type="email"
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="example@email.com"
  className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-6 py-4
             font-bold text-foreground placeholder:text-muted-foreground/30
             focus:outline-none focus:ring-4 focus:ring-primary/10
             focus:bg-background focus:border-primary/30
             transition-all duration-300"
/>
```

### Primary Button

```typescript
<button
  type="submit"
  disabled={loading}
  className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl
             shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1
             active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0
             transition-all duration-300 flex items-center justify-center gap-3"
>
  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
</button>
```

### Sidebar Navigation

```typescript
<nav className="w-64 bg-sidebar border-r border-sidebar-border h-screen sticky top-0">
  <div className="p-4 space-y-2">
    {navItems.map((item) => (
      <a key={item.href} href={item.href}
         className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground
                    hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                    transition-colors duration-200">
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </a>
    ))}
  </div>
</nav>
```

### Lesson Content Card

```typescript
<article className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
  <div className="aspect-video bg-muted relative">
    {/* Video or content */}
  </div>
  <div className="p-6 space-y-4">
    <h2 className="text-xl font-bold">{title}</h2>
    <div className="flex items-center gap-4 text-muted-foreground text-sm">
      <span className="flex items-center gap-1.5">
        <Clock className="w-4 h-4" />
        {duration} min
      </span>
    </div>
  </div>
</article>
```

## Layout Patterns

### Root Layout with i18n

```typescript
// app/[locale]/layout.tsx
import "@repo/ui/styles.css";
import type { Metadata } from "next";
import { ThemeProvider } from "@repo/ui";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LMS Student",
  description: "LMS Student Portal",
};

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  const { children } = props;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
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

### Loading State

```typescript
// app/[locale]/lessons/[lessonId]/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-2/3" />
      <div className="aspect-video bg-muted rounded-2xl" />
    </div>
  );
}
```

## API Client Pattern

```typescript
// lib/api.ts (typical structure)
import { createApiClient } from '@repo/api-client';

const api = createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  onUnauthorized: () => {
    window.location.href = '/vi/login';
  },
});

export default api;
```

The shared client enables `withCredentials`, sends `x-csrf-token` from the `csrf_token` cookie, and does not inject `Authorization` from localStorage for browser flows.
