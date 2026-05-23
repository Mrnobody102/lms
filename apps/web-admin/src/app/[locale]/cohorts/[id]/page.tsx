'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Users, UserPlus, ArrowLeft, Trash2, GraduationCap } from 'lucide-react';
import { Link } from '@/navigation';
import { Button, Input } from '@repo/ui';
import { useCohortMembers, useCohorts } from '@/hooks/use-cohorts';
import { useCourses } from '@/hooks/use-courses';

export default function CohortDetailsPage() {
  const t = useTranslations('Admin');
  const params = useParams();
  const cohortId = params.id as string;

  const { cohorts } = useCohorts();
  const cohort = cohorts.find((c) => c.id === cohortId);

  const { members, isLoading, addMembers, removeMember, enrollCourse } = useCohortMembers(cohortId);
  const { data: coursesData } = useCourses({ limit: 100 });
  const courses = coursesData?.data || [];

  const [userIdInput, setUserIdInput] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');

  if (!cohort) {
    return <div className="p-8 text-center">{t('common.loading')}</div>;
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdInput.trim()) return;

    try {
      await addMembers.mutateAsync([userIdInput.trim()]);
      setUserIdInput('');
    } catch (err) {
      console.error('Failed to add member', err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (confirm(t('common.confirmDelete'))) {
      await removeMember.mutateAsync(userId);
    }
  };

  const handleEnrollCourse = async () => {
    if (!selectedCourse) return;
    if (confirm(t('cohorts.confirmEnroll'))) {
      try {
        await enrollCourse.mutateAsync(selectedCourse);
        setSelectedCourse('');
        alert(t('cohorts.enrollSuccess'));
      } catch (err) {
        console.error('Failed to enroll', err);
        alert(t('cohorts.enrollError'));
      }
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
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
              >
                <option value="">{t('cohorts.selectCourse')}</option>
                {courses?.map((course: { id: string; title: string }) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <Button
                className="w-full"
                disabled={!selectedCourse || enrollCourse.isPending || members.length === 0}
                onClick={handleEnrollCourse}
              >
                {enrollCourse.isPending ? t('common.loading') : t('cohorts.enrollBtn')}
              </Button>
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

              <form onSubmit={handleAddMember} className="flex gap-2">
                <Input
                  placeholder={t('cohorts.userIdPlaceholder')}
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  className="w-48 text-sm h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!userIdInput.trim() || addMembers.isPending}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('common.add')}
                </Button>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          onClick={() => handleRemoveMember(member.user.id)}
                          disabled={removeMember.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
