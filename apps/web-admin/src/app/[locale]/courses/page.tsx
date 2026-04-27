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

export default function CoursesPage() {
  const t = useTranslations('Admin');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  const { data: courseData, isLoading, error } = useCourses();
  const deleteCourse = useDeleteCourse();

  const allCourses = Array.isArray(courseData?.data) ? courseData.data : [];
  const courses = allCourses.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase());
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
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={t('searchCourses')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
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
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t('noCourses')}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">{t('noCoursesDesc')}</p>
                <Link href="/courses/new">
                  <Button>{t('createCourseNow')}</Button>
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {courses.length} {courses.length === 1 ? 'course' : 'courses'}
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
