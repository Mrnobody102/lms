# i18n Workflow

**Tier:** POWERFUL
**Category:** Engineering / Productivity
**Domain:** Internationalization (next-intl)
**Maintainer:** LMS Agent Team

---

## Overview

Standard workflow for managing multi-language support (Vietnamese and English) across the LMS platform using `next-intl`. The platform has three Next.js apps (`web-student`, `web-admin`, `super-portal`), each with its own `src/messages/` directory containing `vi.json` and `en.json`.

## Core Capabilities

- **locale_key_management**: Keeping `vi.json` and `en.json` synchronized across all three apps.
- **locale_routing**: Using `[locale]` dynamic segments in Next.js App Router with next-intl middleware.
- **server_client_i18n**: Using `getTranslations` in Server Components and `useTranslations` in Client Components.
- **dynamic_message_resolution**: Handling parameterized strings, plurals, and fallback values.

## Language Files

Each app stores translations in:
- `apps/web-student/src/messages/vi.json`
- `apps/web-student/src/messages/en.json`
- `apps/web-admin/src/messages/vi.json`
- `apps/web-admin/src/messages/en.json`
- `apps/super-portal/src/messages/vi.json`
- `apps/super-portal/src/messages/en.json`

## When to Use

Use when:
- Adding new user-facing strings in any Next.js app
- Creating new pages or UI components
- Modifying existing translation keys

Skip when:
- Writing server-side logic (API routes, services) that does not render UI
- Updating internal variable names or code comments

## Key Workflows

### Adding New Translation Keys

1. Identify the component/page scope (e.g., `Student`, `Admin`, `Auth`).
2. Add the key to both `vi.json` and `en.json` in the relevant app.
3. Use the translation in code: `t("Scope.keyName")` with scoped imports.
4. Verify the key exists in both files before committing.

### Message Key Naming Convention

Use dot-notation with consistent scope prefixes:

```
{Scope}.{Section}.{Component}.{property}
```

Examples:
- `Student.hero.title` -- Hero section title on student home
- `Admin.lesson.form.title` -- Form title in lesson admin
- `Auth.login.button` -- Login button text
- `Common.status.loading` -- Shared loading indicator text

### Variable Interpolation

Use curly-brace syntax for dynamic values:

```json
// vi.json
{
  "Lesson": {
    "progress": "Bạn đã hoàn thành {percent}% bài học"
  }
}
```

```typescript
// In component
t("Lesson.progress", { percent: 75 })
```

### Pluralization

Use ICU message syntax for plurals:

```json
{
  "Vocab": {
    "cardCount": "{count, plural, =0 {Khong co tu vung} one {# tu vung} other {# tu vung}}"
  }
}
```

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Missing key in one locale | Always update both `vi.json` and `en.json` in the same commit |
| Hardcoded strings in JSX | Search for untranslated strings before marking i18n done |
| Using wrong locale in `getTranslations` | Always pass the locale from `getLocale()` or props |
| Mixing up translation namespaces | Use scoped `useTranslations("Scope")` to avoid key collisions |
| Middleware blocking static assets | Ensure `favicon.ico`, fonts, and `/public/*` are excluded from locale routing |

## Best Practices

1. **Scope your translations**: Use `useTranslations("ModuleName")` rather than a single global namespace.
2. **Never hardcode display strings**: Every visible string goes into translation files.
3. **Update both locales atomically**: A PR that changes one locale but not the other is incomplete.
4. **Use consistent key naming**: Group by feature/page first, then component, then property.
5. **Keep keys flat where possible**: Deep nesting (`a.b.c.d.e`) is hard to maintain. Prefer `Section.component.property`.

## Related Skills

| Skill | Use When |
|---|---|
| engineering-planning | Planning includes adding new pages with user-facing strings |
| deployment-ops | i18n changes require rebuilding Next.js apps to take effect |

## Reference Documentation

- See `references/i18n-patterns.md` for locale routing setup, server/client component examples, and common translation mistakes.
