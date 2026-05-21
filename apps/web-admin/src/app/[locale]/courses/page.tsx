'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { useCourses, useDeleteCourse } from '@/hooks/use-courses';
import { CourseCard } from '@/features/courses/course-card';
import { Button, Input, Separator, Skeleton, Alert, AlertDescription } from '@/components/ui';
import { BookOpen, AlertCircle, Search } from 'lucide-react';
import { Link } from '@/navigation';
import { useDebounce } from '@/hooks/use-debounce';

export default function CoursesPage() {
  const t = useTranslations('Admin');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data: courseData, isLoading, error } = useCourses();
  const deleteCourse = useDeleteCourse();
  const debouncedSearch = useDebounce(search, 300);

  const allCourses = Array.isArray(courseData?.data) ? courseData.data : [];
  const courses = allCourses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(debouncedSearch.toLowerCase());
    const lessonCount = c._count?.lessons ?? c.lessons?.length ?? 0;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'published' && lessonCount > 0) ||
      (filter === 'draft' && lessonCount === 0);
    return matchesSearch && matchesFilter;
  });

  const errorMessage = error instanceof Error ? error.message : error ? String(error) : null;

  const handleDelete = (courseId: string) => {
    deleteCourse.mutate(courseId);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader
              title={t('courses')}
              description={t('courseManagement')}
              showCreateCourse={true}
            />

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex h-11 flex-1 items-center rounded-xl border border-input bg-background text-foreground shadow-sm transition-all focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/50">
                <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t('searchCourses')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'published', 'draft'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(f)}
                  >
                    {f === 'all'
                      ? t('allCourses')
                      : f === 'published'
                        ? t('published')
                        : t('draft')}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="mb-8" />

            {/* Content */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card border rounded-xl p-5 space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <Skeleton className="w-8 h-8 rounded-md" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            ) : errorMessage ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-dashed bg-muted/20">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-5">
                  <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight mb-2">{t('noCourses')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-8">{t('noCoursesDesc')}</p>
                <Link href="/courses/new">
                  <Button className="rounded-xl px-6">{t('createCourseNow')}</Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('coursesFound', { count: courses.length })}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onDelete={handleDelete}
                      deleting={deleteCourse.isPending}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
