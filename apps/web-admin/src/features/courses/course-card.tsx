'use client';

import { BookOpen, Edit2, Trash2, MoreHorizontal, Eye, EyeOff, Globe, Loader2 } from 'lucide-react';

import { Course } from '@/lib/course-api';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { useToggleCourseStatus } from '@/hooks/use-courses';
import Image from 'next/image';

interface CourseCardProps {
  course: Course;
  onDelete: (courseId: string) => void;
  deleting: boolean;
}

export function CourseCard({ course, onDelete, deleting }: CourseCardProps) {
  const t = useTranslations('Admin');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const toggleStatus = useToggleCourseStatus();
  const lessonCount = course._count?.lessons ?? course.lessons?.length ?? 0;
  const firstLessonId = course.lessons?.[0]?.id;
  const studentBaseUrl = process.env.NEXT_PUBLIC_WEB_STUDENT_URL;
  const previewUrl =
    studentBaseUrl && firstLessonId ? `${studentBaseUrl}/vi/lessons/${firstLessonId}` : null;
  const isActive = course.isActive !== false; // default true if undefined

  const handleToggleStatus = () => {
    toggleStatus.mutate({ id: course.id, isActive: !isActive });
  };

  return (
    <>
      <div className="bg-card border rounded-xl flex flex-col gap-0 group hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300 overflow-hidden">
        {/* Cover Image */}
        {course.coverImageUrl ? (
          <div className="relative h-36 w-full overflow-hidden bg-muted">
            <Image
              src={course.coverImageUrl}
              alt={course.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center border-b">
            <BookOpen className="w-10 h-10 text-primary/30" />
          </div>
        )}

        <div className="p-5 flex flex-col gap-4 flex-1">
          {/* Header row: status badge + action menu */}
          <div className="flex items-start justify-between gap-3">
            <Badge variant={isActive ? 'success' : 'outline'} className="text-xs shrink-0">
              {isActive ? t('published') : t('draft')}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href={`/courses/${course.id}/edit`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    {t('edit')}
                  </Link>
                </DropdownMenuItem>
                {previewUrl && (
                  <DropdownMenuItem asChild>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      {t('preview')}
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="cursor-pointer"
                  onSelect={handleToggleStatus}
                  disabled={toggleStatus.isPending}
                >
                  {isActive ? (
                    <>
                      <EyeOff className="w-4 h-4" /> {t('unpublishCourse')}
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" /> {t('publishCourse')}
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onSelect={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('deleteCourse')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Title */}
          <div className="flex-1">
            <h3 className="font-semibold text-base line-clamp-2 leading-snug text-foreground group-hover:text-primary transition-colors">
              {course.title}
            </h3>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {lessonCount} {t('lessons')}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {toggleStatus.isPending && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              )}
              <Link href={`/courses/${course.id}/edit`}>
                <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('edit')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 cursor-pointer bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative z-50 bg-background border rounded-xl p-6 shadow-xl max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold mb-2">{t('deleteCourse')}</h3>
            <p className="text-sm text-muted-foreground mb-6">{t('confirmDeleteCourse')}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                {t('cancel')}
              </Button>
              <Button
                variant="destructive"
                disabled={deleting}
                onClick={() => {
                  onDelete(course.id);
                  setShowDeleteConfirm(false);
                }}
              >
                {deleting ? t('loading') : t('deleteCourse')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
