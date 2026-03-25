'use client';

import { BookOpen, Edit2, ExternalLink, Trash2, MoreHorizontal, Eye } from 'lucide-react';
import { Course } from '@/lib/course-api';
import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface CourseCardProps {
  course: Course;
  onDelete: (courseId: string) => void;
  deleting: boolean;
}

export function CourseCard({ course, onDelete, deleting }: CourseCardProps) {
  const t = useTranslations('Admin');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const lessonCount = course._count?.lessons ?? 0;

  return (
    <>
      <div className="bg-card border rounded-xl p-5 flex flex-col gap-4 group hover:shadow-md hover:border-primary/20 transition-all">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
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
              {lessonCount > 0 && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`${process.env.NEXT_PUBLIC_WEB_STUDENT_URL || 'http://localhost:3000'}/vi/lessons/${course.lessons[0]?.id}`}
                    target="_blank"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    {t('preview')}
                  </Link>
                </DropdownMenuItem>
              )}
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
          <Link href={`/courses/${course.id}/edit`}>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5">
              <Edit2 className="w-3.5 h-3.5" />
              {t('edit')}
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
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
