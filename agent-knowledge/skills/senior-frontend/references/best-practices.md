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
import axios from 'axios';
import { useAuthStore } from '@/features/auth/auth.store';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  const tenantId = localStorage.getItem('tenantId');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenantId) config.headers['x-tenant-id'] = tenantId;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);
```

## Responsive Design

```tsx
// Mobile-first breakpoints
<div className="
  grid gap-4
  grid-cols-1        /* Default: mobile */
  sm:grid-cols-2     /* 640px+ */
  md:grid-cols-3     /* 768px+ */
  lg:grid-cols-4     /* 1024px+ */
">
  {courses.map((course) => (
    <CourseCard key={course.id} course={course} />
  ))}
</div>
```
