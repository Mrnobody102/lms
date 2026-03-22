'use client';

import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Map,
  GraduationCap,
  ArrowRight,
  Loader2,
  User as UserIcon,
  LogOut,
} from 'lucide-react';
import { ThemeToggle, LanguageToggle } from '@repo/ui';
import { Link } from '../../../navigation';
import { useCourses } from '../../../hooks/use-courses';
import { useAuthStore } from '../../../features/auth/auth.store';

export default function CoursesPage() {
  const t = useTranslations('Student');
  const { data: courses = [], isLoading } = useCourses();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className="min-h-screen font-sans bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/80 backdrop-blur-md px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
            L
          </div>
          <span className="font-bold text-lg tracking-tight">LMS Learning</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageToggle />
          <div className="w-px h-5 bg-border" />
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium hidden lg:block max-w-[100px] truncate">
                {user?.fullName}
              </p>
              <button
                onClick={() => logout()}
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all rounded-lg hover:bg-destructive/5"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all"
              >
                {t('cta.login')}
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all"
              >
                {t('cta.register')}
              </Link>
            </>
          )}
        </div>
      </nav>

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
            {courses.map((course) => (
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
                      <span>
                        {t('courses.lessonsCount', { count: course.lessons?.length || 0 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Map className="w-3.5 h-3.5" />
                      <span>
                        {t('courses.duration', {
                          minutes:
                            course.lessons?.reduce(
                              (acc: number, l: { duration?: number }) => acc + (l.duration || 0),
                              0,
                            ) || 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto px-6 pb-6">
                  <Link
                    href={course.lessons?.[0]?.id ? `/lessons/${course.lessons[0].id}` : '#'}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    {t('courses.startNow')}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
