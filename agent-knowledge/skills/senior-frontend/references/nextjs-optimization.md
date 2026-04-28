# Senior Frontend: Next.js Optimization Guide

## Server vs Client Component Decision

| Need                        | Use              |
| --------------------------- | ---------------- |
| Database access, Prisma     | Server Component |
| Static content              | Server Component |
| Auth state, tokens          | Client Component |
| Interactivity (click, form) | Client Component |
| useState, useEffect         | Client Component |
| Browser APIs                | Client Component |

## Data Fetching Patterns

### Parallel Fetching

```tsx
// app/[locale]/dashboard/page.tsx
async function DashboardPage() {
  const [user, courses, announcements] = await Promise.all([
    getUser(),
    getCourses(),
    getAnnouncements(),
  ]);

  return (
    <div>
      <WelcomeBanner user={user} />
      <CourseGrid courses={courses} />
      <Announcements items={announcements} />
    </div>
  );
}
```

### Sequential with Caching

```tsx
// Fetch user first, then courses based on user preferences
async function StudentPage() {
  const user = await getUser();
  const courses = await getCoursesByRole(user.role);
  return <CourseList courses={courses} />;
}
```

### Streaming with Suspense

```tsx
import { Suspense } from 'react';

async function CoursePage({ params }: { params: { id: string } }) {
  return (
    <div>
      <CourseHeader id={params.id} />
      <Suspense fallback={<LessonSkeleton />}>
        <LessonList courseId={params.id} />
      </Suspense>
    </div>
  );
}
```

## Image Optimization

```tsx
import Image from 'next/image';

// Hero — above the fold, load immediately
<Image
  src="/hero-banner.jpg"
  alt="Course hero"
  width={1200}
  height={600}
  priority
/>

// Responsive fill
<div className="relative aspect-video w-full">
  <Image
    src={course.thumbnail}
    alt={course.title}
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    className="object-cover"
  />
</div>
```

## Dynamic Imports

```tsx
import dynamic from 'next/dynamic';

const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), {
  loading: () => <PlayerSkeleton />,
  ssr: false, // for browser-only players
});
```

## Route Groups

```
app/
├── (marketing)/
│   ├── page.tsx          # /
│   ├── about/page.tsx    # /about
│   └── pricing/page.tsx  # /pricing
└── (app)/
    ├── layout.tsx        # authenticated layout with sidebar
    ├── dashboard/page.tsx
    └── courses/page.tsx
```

## Loading.tsx Pattern

```tsx
// app/[locale]/courses/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}
```

## Error.tsx Pattern

```tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <button onClick={() => reset()} className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white">
        Try again
      </button>
    </div>
  );
}
```
