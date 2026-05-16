'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Search, UserMinus, UserPlus } from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';
import { AdminUser } from '@/lib/admin-user-api';
import { CourseEnrollment } from '@/lib/course-api';
import { useStudents } from '@/hooks/use-admin-users';
import { useDebounce } from '@/hooks/use-debounce';

interface EnrollmentPanelProps {
  courseId: string;
  enrollments: CourseEnrollment[];
  enrolling: boolean;
  unenrolling: boolean;
  onEnroll: (userId: string) => Promise<boolean>;
  onUnenroll: (userId: string) => Promise<boolean>;
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'enrolled' | 'not_enrolled'>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState<'enroll' | 'unenroll' | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useStudents({ search: debouncedSearch.trim() || undefined });

  const enrolledUserIds = useMemo(
    () => new Set(enrollments.map((enrollment) => enrollment.userId)),
    [enrollments],
  );

  const students = useMemo(() => data?.data ?? [], [data]);
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const isEnrolled = enrolledUserIds.has(student.id);
      if (statusFilter === 'enrolled') return isEnrolled;
      if (statusFilter === 'not_enrolled') return !isEnrolled;
      return true;
    });
  }, [enrolledUserIds, statusFilter, students]);
  const selectedStudents = useMemo(
    () => filteredStudents.filter((student) => selectedStudentIds.includes(student.id)),
    [filteredStudents, selectedStudentIds],
  );
  const hasFilters = Boolean(search.trim()) || statusFilter !== 'all';

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

      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
        <div className="flex h-10 items-center rounded-md border border-input bg-background text-foreground transition-colors focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setSelectedStudentIds([]);
            }}
            placeholder={t('searchStudents')}
            className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value as 'all' | 'enrolled' | 'not_enrolled');
            setSelectedStudentIds([]);
          }}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="enrolled">{t('enrolledOnly')}</option>
          <option value="not_enrolled">{t('notEnrolledOnly')}</option>
        </select>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setSearch('');
            setStatusFilter('all');
            setSelectedStudentIds([]);
          }}
          disabled={!hasFilters}
        >
          {t('clearFilters')}
        </Button>
      </div>

      {selectedStudentIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
          <span className="text-sm font-medium">
            {t('selectedStudentsValue', { count: selectedStudentIds.length })}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setSelectedStudentIds(filteredStudents.map((student) => student.id))}
              disabled={filteredStudents.length === 0}
            >
              {t('selectVisibleStudents')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setSelectedStudentIds([])}
            >
              {t('clearSelection')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setBulkMode('enroll');
                setBulkConfirm(true);
              }}
              disabled={selectedStudents.every((student) => enrolledUserIds.has(student.id))}
            >
              <UserPlus className="h-4 w-4" />
              {t('enrollSelected')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setBulkMode('unenroll');
                setBulkConfirm(true);
              }}
              disabled={selectedStudents.every((student) => !enrolledUserIds.has(student.id))}
            >
              <UserMinus className="h-4 w-4" />
              {t('unenrollSelected')}
            </Button>
          </div>
        </div>
      )}

      {bulkConfirm && bulkMode && selectedStudents.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <span className="text-sm text-destructive">
            {bulkMode === 'enroll'
              ? t('confirmBulkEnrollStudents', { count: selectedStudents.length })
              : t('confirmBulkUnenrollStudents', { count: selectedStudents.length })}
          </span>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => setBulkConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              variant={bulkMode === 'enroll' ? 'default' : 'destructive'}
              disabled={enrolling || unenrolling}
              onClick={async () => {
                const ids = selectedStudents.map((student) => student.id);
                for (const id of ids) {
                  if (bulkMode === 'enroll' && !enrolledUserIds.has(id)) {
                    await onEnroll(id);
                  }
                  if (bulkMode === 'unenroll' && enrolledUserIds.has(id)) {
                    await onUnenroll(id);
                  }
                }
                setSelectedStudentIds([]);
                setBulkConfirm(false);
                setBulkMode(null);
              }}
            >
              {enrolling || unenrolling ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {bulkMode === 'enroll' ? t('enrollSelected') : t('unenrollSelected')}
            </Button>
          </div>
        </div>
      )}

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
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-md border p-3 text-sm text-muted-foreground">
            {t('noFilteredStudents')}
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isEnrolled = enrolledUserIds.has(student.id);
            const isBusy = enrolling || unenrolling;

            return (
              <StudentEnrollmentRow
                key={student.id}
                student={student}
                isEnrolled={isEnrolled}
                isBusy={isBusy}
                selected={selectedStudentIds.includes(student.id)}
                onToggleSelect={(checked) =>
                  setSelectedStudentIds((current) =>
                    checked
                      ? current.includes(student.id)
                        ? current
                        : [...current, student.id]
                      : current.filter((id) => id !== student.id),
                  )
                }
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
  selected,
  onToggleSelect,
  onEnroll,
  onUnenroll,
}: {
  student: AdminUser;
  isEnrolled: boolean;
  isBusy: boolean;
  selected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onEnroll: (userId: string) => Promise<boolean>;
  onUnenroll: (userId: string) => Promise<boolean>;
}) {
  const t = useTranslations('Admin');

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1"
          checked={selected}
          onChange={(event) => onToggleSelect(event.target.checked)}
          aria-label={t('selectItem')}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{student.fullName || student.email}</p>
          <p className="truncate text-xs text-muted-foreground">{student.email}</p>
        </div>
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
              void onUnenroll(student.id);
            } else {
              void onEnroll(student.id);
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
