'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Search, UserMinus, UserPlus } from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';
import { AdminUser } from '@/lib/admin-user-api';
import { CourseEnrollment } from '@/lib/course-api';
import { useStudents } from '@/hooks/use-admin-users';

interface EnrollmentPanelProps {
  courseId: string;
  enrollments: CourseEnrollment[];
  enrolling: boolean;
  unenrolling: boolean;
  onEnroll: (userId: string) => void;
  onUnenroll: (userId: string) => void;
}

export function EnrollmentPanel({
  courseId,
  enrollments,
  enrolling,
  unenrolling,
  onEnroll,
  onUnenroll,
}: EnrollmentPanelProps) {
  const t = useTranslations('Admin');
  const [search, setSearch] = useState('');
  const { data, isLoading } = useStudents({ search: search.trim() || undefined });

  const enrolledUserIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.userId)),
    [enrollments],
  );

  const students = data?.data ?? [];

  return (
    <section className="space-y-4" aria-labelledby={`${courseId}-enrollments-heading`}>
      <div>
        <h2 id={`${courseId}-enrollments-heading`} className="text-base font-semibold">
          {t('enrollments')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('enrollmentCount', { count: enrollments.length })}
        </p>
      </div>

      <div className="flex h-10 items-center rounded-md border border-input bg-background text-foreground transition-colors focus-within:ring-2 focus-within:ring-primary/20">
        <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t('searchStudents')}
          className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
        />
      </div>

      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="flex items-center gap-2 rounded-md border p-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('loading')}
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            {t('noStudents')}
          </div>
        ) : (
          students.map((student) => {
            const isEnrolled = enrolledUserIds.has(student.id);
            const isBusy = enrolling || unenrolling;

            return (
              <StudentEnrollmentRow
                key={student.id}
                student={student}
                isEnrolled={isEnrolled}
                isBusy={isBusy}
                onEnroll={onEnroll}
                onUnenroll={onUnenroll}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

function StudentEnrollmentRow({
  student,
  isEnrolled,
  isBusy,
  onEnroll,
  onUnenroll,
}: {
  student: AdminUser;
  isEnrolled: boolean;
  isBusy: boolean;
  onEnroll: (userId: string) => void;
  onUnenroll: (userId: string) => void;
}) {
  const t = useTranslations('Admin');

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{student.fullName || student.email}</p>
        <p className="truncate text-xs text-muted-foreground">{student.email}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isEnrolled && <Badge variant="secondary">{t('enrolled')}</Badge>}
        <Button
          type="button"
          size="sm"
          variant={isEnrolled ? 'outline' : 'default'}
          disabled={isBusy}
          onClick={() => {
            if (isEnrolled) {
              onUnenroll(student.id);
            } else {
              onEnroll(student.id);
            }
          }}
          className="gap-1.5"
        >
          {isBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isEnrolled ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <UserPlus className="h-4 w-4" />
          )}
          {isEnrolled ? t('unenroll') : t('enroll')}
        </Button>
      </div>
    </div>
  );
}
