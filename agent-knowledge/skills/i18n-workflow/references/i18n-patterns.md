# i18n Patterns Reference

This document provides concrete patterns and examples for next-intl usage across the LMS platform.

## Locale Routing

The LMS uses Next.js App Router with `[locale]` dynamic segments. The next-intl middleware handles locale detection and routing.

### Middleware Configuration

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'vi'],
  defaultLocale: 'en',
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### Navigation with Locale

Use the `Link` component from next-intl (not the default Next.js `Link`) to preserve locale in navigation:

```typescript
import Link from "next-intl/link";

// Correct: preserves locale
<Link href="/courses" locale="en">Courses</Link>

// Avoid: hardcodes locale, breaks when switching
<Link href="/vi/courses">Khoa hoc</Link>
```

### Switching Locales

```typescript
import { useRouter, usePathname } from "next/navigation";

function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (locale: string) => {
    router.push(pathname.replace(/^\/(en|vi)/, `/${locale}`));
  };

  return (
    <select onChange={(e) => switchLocale(e.target.value)}>
      <option value="en">English</option>
      <option value="vi">Tieng Viet</option>
    </select>
  );
}
```

---

## Server Component Usage

Use `getTranslations` (async) or `getTranslation` in Server Components:

```typescript
// app/[locale]/layout.tsx
import { getTranslations } from "next-intl/server";

export default async function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}

// app/[locale]/page.tsx
import { getTranslations } from "next-intl/server";

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Student" });

  return (
    <div>
      <h1>{t("hero.title")}</h1>
      <p>{t("hero.desc")}</p>
      <button>{t("hero.cta")}</button>
    </div>
  );
}
```

### Page-Level Translation with Static Params

```typescript
// app/[locale]/courses/page.tsx
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "~/i18n";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "vi" }];
}

export default async function CoursesPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Course" });

  return (
    <main>
      <h1>{t("list.title")}</h1>
      {/* course list */}
    </main>
  );
}
```

---

## Client Component Usage

Use `useTranslations` hook in Client Components:

```typescript
"use client";

import { useTranslations } from "next-intl";

export function CourseCard({ course }: { course: Course }) {
  const t = useTranslations("Course");

  return (
    <div className="course-card">
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <span>{t("card.level", { level: course.level })}</span>
    </div>
  );
}
```

### Passing Translations to Client Components

If a Client Component needs translations, pass them as props from the Server Component:

```typescript
// Server Component (page.tsx)
import { getTranslations } from "next-intl/server";

export default async function LessonPage({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: "Lesson" });

  return (
    <LessonPlayer
      translations={{
        complete: t("button.complete"),
        next: t("button.next"),
        prev: t("button.prev"),
      }}
    />
  );
}
```

```typescript
// Client Component (LessonPlayer.tsx)
"use client";

export function LessonPlayer({
  translations,
}: {
  translations: { complete: string; next: string; prev: string };
}) {
  return (
    <div>
      <button>{translations.complete}</button>
    </div>
  );
}
```

---

## Message Key Naming Conventions

### Structure

```
{Feature}.{SubSection}.{Component}.{property}
```

### Example: Student Portal

```json
{
  "Student": {
    "nav": {
      "courses": "Courses",
      "vocab": "Vocabulary",
      "blog": "Blog",
      "home": "Home"
    },
    "hero": {
      "badge": "Learn Chinese with HSK Standards",
      "title": "Master",
      "titleAlt": "Chinese",
      "desc": "Comprehensive online learning platform..."
    },
    "features": {
      "whyUs": "Why Choose Us?",
      "items": {
        "hsk": { "title": "Standard HSK Roadmap", "desc": "..." },
        "library": { "title": "Massive Library", "desc": "..." }
      }
    }
  }
}
```

### Example: Admin Portal

```json
{
  "Admin": {
    "lesson": {
      "form": {
        "title": "Create Lesson",
        "titleEdit": "Edit Lesson",
        "name": "Lesson Name",
        "description": "Description",
        "save": "Save",
        "cancel": "Cancel"
      },
      "list": {
        "title": "All Lessons",
        "empty": "No lessons found",
        "columns": {
          "name": "Name",
          "course": "Course",
          "duration": "Duration",
          "actions": "Actions"
        }
      }
    }
  }
}
```

---

## Common Translation Mistakes

### Mistake 1: Updating Only One Locale

```typescript
// WRONG: Only updated en.json, vi.json is missing
{
  "Course": {
    "newField": "New field added"  // Missing in vi.json
  }
}
```

Always update both files in the same commit.

### Mistake 2: Hardcoding Strings

```typescript
// WRONG
<h1>Welcome to the course</h1>

// CORRECT
<h1>{t("Course.welcome")}</h1>
```

### Mistake 3: Forgetting Variables

```typescript
// vi.json key
"progress": "Hoan thanh {percent}%"

// WRONG: Missing variable
t("Lesson.progress")

// CORRECT
t("Lesson.progress", { percent: 75 })
```

### Mistake 4: Deep Nesting

```typescript
// AVOID: Too deep
t('Course.Detail.Sidebar.LessonList.Item.title');

// PREFER: Flat
t('Course.lessonItem.title');
```

### Mistake 5: Not Excluding Public Assets from Middleware

Ensure `next.config.js` or middleware does not apply locale routing to static files:

```typescript
// middleware.ts - already configured correctly
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

The `.*\\..*` pattern excludes paths with file extensions (`.ico`, `.png`, `.woff2`, etc.).

---

## Verification Checklist

Before marking i18n work complete:

- [ ] All new user-facing strings have keys in both `vi.json` and `en.json`
- [ ] Variable names in translation calls match the placeholders in JSON
- [ ] No hardcoded strings remain in JSX (search for display text not in `t()` calls)
- [ ] Pages build without missing translation key warnings
- [ ] Locale switcher works on both language options
