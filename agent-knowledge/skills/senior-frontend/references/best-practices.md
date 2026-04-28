# Senior Frontend: Best Practices

## Accessibility Checklist

1. **Semantic HTML**: Use proper elements (`<button>`, `<nav>`, `<main>`, `<article>`)
2. **Keyboard Navigation**: All interactive elements focusable; visible focus indicators
3. **ARIA Labels**: Provide labels for icon-only buttons
4. **Color Contrast**: Minimum 4.5:1 for normal text; 3:1 for large text
5. **Form Labels**: Every input has a corresponding `<label>`

```tsx
// Icon button with accessibility
<button
  type="button"
  aria-label="Close dialog"
  className="focus-visible:ring-2 focus-visible:ring-blue-500"
>
  <XIcon aria-hidden="true" className="h-5 w-5" />
</button>

// Skip link for keyboard users
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
  Skip to main content
</a>
```

## API Client Pattern

```typescript
// lib/api.ts
import { createApiClient } from '@repo/api-client';

export const apiClient = createApiClient({
  tenantId: process.env.NEXT_PUBLIC_TENANT_ID,
  onUnauthorized: () => {
    window.location.href = '/vi/login';
  },
});
```

The shared client sends cookie credentials, injects `x-csrf-token` from the CSRF cookie, handles local/dev tenant hints, and clears legacy auth state on 401. Do not inject Bearer tokens from browser localStorage.

## Responsive Design

```tsx
// Mobile-first breakpoints
<div
  className="
  grid gap-4
  grid-cols-1        /* Default: mobile */
  sm:grid-cols-2     /* 640px+ */
  md:grid-cols-3     /* 768px+ */
  lg:grid-cols-4     /* 1024px+ */
"
>
  {courses.map((course) => (
    <CourseCard key={course.id} course={course} />
  ))}
</div>
```
