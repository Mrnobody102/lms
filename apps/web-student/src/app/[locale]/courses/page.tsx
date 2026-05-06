'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Map, GraduationCap, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from '../../../navigation';
import { useCourses } from '../../../hooks/use-courses';
import { StudentNav } from '../../../components/layout/student-nav';

export default function CoursesPage() {
  const t = useTranslations('Student');
  const { data: courses = [], isLoading } = useCourses();

  return (
    <div className="min-h-screen font-sans">
      <StudentNav />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{t('courses.title')}</h1>
          <p className="text-muted-foreground text-base max-w-2xl">{t('courses.subtitle')}</p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-medium">
              {t('courses.loading') || 'Loading...'}
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <GraduationCap className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              {t('courses.empty') || 'No courses available'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('courses.emptyDesc') || 'Check back later.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const lessonCount = course._count?.lessons ?? course.lessons?.length ?? 0;
              const totalDuration =
                course.totalDuration ??
                (course.lessons?.reduce(
                  (acc: number, lesson: { duration?: number }) => acc + (lesson.duration || 0),
                  0,
                ) ||
                  0);
              const firstLessonId = course.lessons?.[0]?.id;

              return (
                <div
                  key={course.id}
                  className="group bg-card border rounded-xl overflow-hidden flex flex-col hover:shadow-md hover:border-primary/20 transition-all"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <h3 className="font-semibold text-base line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{t('courses.lessonsCount', { count: lessonCount })}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Map className="w-3.5 h-3.5" />
                        <span>{t('courses.duration', { minutes: totalDuration })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto px-6 pb-6">
                    <Link
                      href={firstLessonId ? `/lessons/${firstLessonId}` : '#'}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                    >
                      {t('courses.startNow')}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
