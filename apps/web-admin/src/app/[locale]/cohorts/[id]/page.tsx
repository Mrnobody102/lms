'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users, UserPlus, ArrowLeft, Trash2, GraduationCap, Search, X } from 'lucide-react';
import { Link } from '@/navigation';
import { Button, Input } from '@repo/ui';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useCohortMembers, useCohorts } from '@/hooks/use-cohorts';
import { useCourses } from '@/hooks/use-courses';
import { useDebounce } from '@/hooks/use-debounce';
import { useStudents } from '@/hooks/use-admin-users';
import toast from 'react-hot-toast';

export default function CohortDetailsPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const cohortId = params.id as string;

  const { cohorts } = useCohorts();
  const cohort = cohorts.find((c) => c.id === cohortId);

  const { members, isLoading, addMembers, removeMember, enrollCourse } = useCohortMembers(cohortId);
  const { data: coursesData } = useCourses({ limit: 100 });
  const courses = useMemo(() => coursesData?.data ?? [], [coursesData]);

  const [studentQuery, setStudentQuery] = useState('');
  const debouncedStudentQuery = useDebounce(studentQuery, 300);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseQuery, setCourseQuery] = useState('');

  const { data: studentsData, isLoading: isSearchingStudents } = useStudents({
    page: 1,
    limit: 10,
    search: debouncedStudentQuery.trim() || undefined,
    isActive: true,
  });

  const memberUserIds = useMemo(() => new Set(members.map((member) => member.user.id)), [members]);
  const selectedStudentIdSet = useMemo(() => new Set(selectedStudentIds), [selectedStudentIds]);
  const suggestedStudents = useMemo(
    () =>
      (studentsData?.data ?? []).filter(
        (student) => !memberUserIds.has(student.id) && !selectedStudentIdSet.has(student.id),
      ),
    [studentsData, memberUserIds, selectedStudentIdSet],
  );

  const selectedStudents = useMemo(() => {
    const studentMap = new Map((studentsData?.data ?? []).map((student) => [student.id, student]));
    return selectedStudentIds
      .map((id) => {
        const student = studentMap.get(id);
        if (!student) {
          return null;
        }
        return {
          id: student.id,
          label: student.fullName || student.email,
          email: student.email,
        };
      })
      .filter(
        (student): student is { id: string; label: string; email: string } => student !== null,
      );
  }, [selectedStudentIds, studentsData]);

  const filteredCourses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) return courses;
    return courses.filter((course: { id: string; title: string }) =>
      course.title.toLowerCase().includes(query),
    );
  }, [courseQuery, courses]);

  const selectedCourseTitle = useMemo(
    () =>
      courses.find((course: { id: string; title: string }) => course.id === selectedCourse)
        ?.title ?? '',
    [courses, selectedCourse],
  );

  const toggleSelectedStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      return [...prev, studentId];
    });
  };

  if (!cohort) {
    return <div className="p-8 text-center">{t('common.loading')}</div>;
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    try {
      const result = await addMembers.mutateAsync(selectedStudentIds);
      setSelectedStudentIds([]);
      setStudentQuery('');
      toast.success(
        t('cohorts.membersAddedDetailed', {
          addedCount: result?.addedCount ?? selectedStudentIds.length,
          skippedCount: result?.skippedCount ?? 0,
          invalidCount: result?.invalidCount ?? 0,
        }),
      );
    } catch (err) {
      console.error('Failed to add member', err);
      toast.error(t('cohorts.addMemberError'));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember.mutateAsync(userId);
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse) return;
    try {
      await enrollCourse.mutateAsync(selectedCourse);
      setSelectedCourse('');
      setCourseQuery('');
      toast.success(t('cohorts.enrollSuccess'));
    } catch (err) {
      console.error('Failed to enroll', err);
      toast.error(t('cohorts.enrollError'));
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/cohorts" className="p-2 hover:bg-muted rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{cohort.name}</h1>
          <p className="text-muted-foreground mt-1">{t('cohorts.membersSubtitle')}</p>
          {cohort.instructor && (
            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-primary bg-primary/10 w-fit px-3 py-1 rounded-full">
              <GraduationCap className="w-4 h-4" />
              <span>{t('cohorts.instructorAssigned', { name: cohort.instructor.fullName })}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bulk Actions */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-primary" />
              {t('cohorts.bulkEnrollTitle')}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{t('cohorts.bulkEnrollDesc')}</p>
            <div className="space-y-3">
              <div className="space-y-2">
                <Input
                  value={courseQuery}
                  onChange={(e) => {
                    setCourseQuery(e.target.value);
                    if (selectedCourse && e.target.value !== selectedCourseTitle) {
                      setSelectedCourse('');
                    }
                  }}
                  placeholder={t('cohorts.courseSearchPlaceholder')}
                  className="h-10 text-sm"
                />
                {courseQuery.trim().length > 0 && !selectedCourse && (
                  <div className="max-h-44 overflow-auto rounded-md border border-border bg-background shadow-sm">
                    {filteredCourses.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        {t('cohorts.noCourseSuggestions')}
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {filteredCourses.map((course: { id: string; title: string }) => (
                          <li key={course.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCourse(course.id);
                                setCourseQuery(course.title);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted/50"
                            >
                              {course.title}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <ConfirmDialog
                description={t('cohorts.confirmEnroll')}
                onConfirm={() => void handleEnrollCourse()}
              >
                <Button
                  className="w-full"
                  disabled={!selectedCourse || enrollCourse.isPending || members.length === 0}
                >
                  {enrollCourse.isPending ? t('common.loading') : t('cohorts.enrollBtn')}
                </Button>
              </ConfirmDialog>
            </div>
          </div>
        </div>

        {/* Members List */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('cohorts.membersListTitle')} ({members.length})
              </h3>

              <form onSubmit={handleAddMember} className="w-full sm:w-auto space-y-2">
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder={t('cohorts.studentSearchPlaceholder')}
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={selectedStudentIds.length === 0 || addMembers.isPending}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('common.add')}
                  </Button>
                </div>

                {selectedStudents.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleSelectedStudent(student.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-1 text-xs"
                      >
                        <span className="max-w-36 truncate">{student.label}</span>
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}

                {studentQuery.trim().length > 0 && (
                  <div className="max-h-44 overflow-auto rounded-md border border-border bg-background shadow-sm">
                    {isSearchingStudents ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        {t('common.loading')}
                      </p>
                    ) : suggestedStudents.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-muted-foreground">
                        {t('cohorts.noStudentSuggestions')}
                      </p>
                    ) : (
                      <ul className="divide-y divide-border">
                        {suggestedStudents.map((student) => (
                          <li key={student.id}>
                            <button
                              type="button"
                              onClick={() => toggleSelectedStudent(student.id)}
                              className="w-full px-3 py-2 text-left hover:bg-muted/50"
                            >
                              <p className="text-sm font-medium">
                                {student.fullName || student.email}
                              </p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </form>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">{t('common.loading')}</div>
              ) : members.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                  <Users className="w-12 h-12 text-muted-foreground opacity-30 mb-3" />
                  <p className="text-muted-foreground">{t('cohorts.noMembers')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {members.map((member) => (
                    <li
                      key={member.id}
                      className="p-4 hover:bg-muted/30 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                          {member.user.fullName?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.user.fullName}</p>
                          <p className="text-xs text-muted-foreground">{member.user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-xs text-muted-foreground hidden sm:block">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </div>
                        <ConfirmDialog
                          description={t('common.confirmDelete')}
                          destructive
                          onConfirm={() => void handleRemoveMember(member.user.id)}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            disabled={removeMember.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
