'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Clock3,
  FileCheck2,
  Loader2,
  Search,
} from 'lucide-react';
import { AdminHeader } from '@/components/layout/admin-header';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { AuthGuard } from '@/components/layout/auth-guard';
import { Alert, AlertDescription, Badge, Input } from '@/components/ui';
import { useCourse, useCourses } from '@/hooks/use-courses';
import { useExams } from '@/hooks/use-exams';

type ScheduleType = 'all' | 'lesson' | 'exam';

interface ScheduleItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'lesson' | 'exam';
  order: number;
  durationMinutes: number;
  status: 'published' | 'draft' | 'active';
}

export default function AdminSchedulePage() {
  const t = useTranslations('Admin');
  const [courseId, setCourseId] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ScheduleType>('all');

  const coursesQuery = useCourses({ page: 1, limit: 100 });
  const courses = useMemo(() => coursesQuery.data?.data ?? [], [coursesQuery.data]);
  const selectedCourseId = courseId || courses[0]?.id || '';
  const courseQuery = useCourse(selectedCourseId);
  const examsQuery = useExams({ courseId: selectedCourseId });

  const items = useMemo<ScheduleItem[]>(() => {
    const course = courseQuery.data;
    if (!course) return [];

    const unitTitleById = new Map((course.units ?? []).map((unit) => [unit.id, unit.title]));
    const lessons = [...(course.lessons ?? [])]
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
      .map((lesson, index) => ({
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.unitId
          ? (unitTitleById.get(lesson.unitId) ?? t('schedule.ungrouped'))
          : t('schedule.ungrouped'),
        type: 'lesson' as const,
        order: index + 1,
        durationMinutes: lesson.duration,
        status: course.isActive ? ('active' as const) : ('draft' as const),
      }));

    const exams = (examsQuery.data ?? []).map((exam, index) => ({
      id: exam.id,
      title: exam.title,
      subtitle: exam.unit?.title ?? t('schedule.courseCheckpoint'),
      type: 'exam' as const,
      order: lessons.length + index + 1,
      durationMinutes: exam.durationMinutes,
      status: exam.isPublished ? ('published' as const) : ('draft' as const),
    }));

    return [...lessons, ...exams].sort((a, b) => a.order - b.order);
  }, [courseQuery.data, examsQuery.data, t]);

  const filteredItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search) ||
        item.subtitle.toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  }, [items, query, typeFilter]);

  const isLoading = coursesQuery.isLoading || courseQuery.isLoading || examsQuery.isLoading;
  const hasError = coursesQuery.isError || courseQuery.isError || examsQuery.isError;

  return (
    <AuthGuard>
      <div className="min-h-screen flex bg-background">
        <AdminSidebar />
        <main className="flex-1 md:ml-64 p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <AdminHeader title={t('schedulePage.title')} description={t('schedulePage.desc')} />

            <div className="mb-5 grid gap-3 lg:grid-cols-[260px_minmax(220px,1fr)_auto]">
              <select
                value={selectedCourseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                disabled={courses.length === 0}
              >
                {courses.length === 0 ? (
                  <option value="">{t('schedulePage.noCourses')}</option>
                ) : (
                  courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))
                )}
              </select>

              <div className="flex h-10 items-center rounded-md border border-input bg-background text-foreground shadow-sm transition-all focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
                <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t('schedulePage.search')}
                  className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['all', 'lesson', 'exam'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTypeFilter(value)}
                    className={`inline-flex h-10 items-center rounded-md border px-3 text-sm font-medium transition-colors ${
                      typeFilter === value
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    {t(`schedulePage.filters.${value}`)}
                  </button>
                ))}
              </div>
            </div>

            {hasError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{t('schedulePage.loadError')}</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <div className="flex items-center gap-2 rounded-md border p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('loading')}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center">
                <CalendarDays className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{t('schedulePage.emptyTitle')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('schedulePage.emptyDesc')}</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                <div className="border-b bg-muted/30 px-5 py-4">
                  <p className="text-sm font-medium">
                    {t('schedulePage.visibleItems', { count: filteredItems.length })}
                  </p>
                </div>
                <div className="divide-y">
                  {filteredItems.map((item) => (
                    <div
                      key={`${item.type}-${item.id}`}
                      className="grid gap-4 px-5 py-4 sm:grid-cols-[3rem_minmax(0,1fr)_140px_120px]"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        {item.type === 'lesson' ? (
                          <BookOpen className="h-4 w-4" />
                        ) : (
                          <FileCheck2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{item.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock3 className="h-4 w-4" />
                        {t('schedulePage.duration', { count: item.durationMinutes })}
                      </div>
                      <div className="flex items-center">
                        <Badge variant={item.status === 'draft' ? 'outline' : 'secondary'}>
                          {t(`schedulePage.status.${item.status}`)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
