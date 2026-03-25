'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Lesson } from '@/lib/course-api';
import {
  Video,
  FileText,
  HelpCircle,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

const typeConfig = {
  video: {
    icon: Video,
    label: 'Video',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  text: {
    icon: FileText,
    label: 'Text',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
  quiz: {
    icon: HelpCircle,
    label: 'Quiz',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
};

interface LessonListProps {
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onAddClick: () => void;
  onReorder?: (lessonId: string, direction: 'up' | 'down') => void;
}

export function LessonList({ lessons, onEdit, onDelete, onAddClick, onReorder }: LessonListProps) {
  const t = useTranslations('Admin');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = [...lessons].sort((a, b) => a.order - b.order);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-base">{t('curriculum')}</h3>
          <Badge variant="secondary" className="text-xs">
            {sorted.length}
          </Badge>
        </div>
        <Button size="sm" onClick={onAddClick} className="gap-1.5">
          <Plus className="w-4 h-4" />
          {t('newLesson')}
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Layers className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{t('noLessons')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('startBuildingDesc')}</p>
          <Button size="sm" variant="outline" onClick={onAddClick} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('addLessonTitle')}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2rem_7rem_1fr_5rem_6rem] gap-2 px-4 py-2.5 bg-muted/50 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span className="text-center">#</span>
            <span>Type</span>
            <span>Title</span>
            <span className="text-right">Duration</span>
            <span className="text-right">Actions</span>
          </div>
          {/* Rows */}
          {sorted.map((lesson, idx) => {
            const cfg = typeConfig[lesson.type as keyof typeof typeConfig] ?? typeConfig.text;
            return (
              <div
                key={lesson.id}
                className="grid grid-cols-[2rem_7rem_1fr_5rem_6rem] gap-2 px-4 py-3 items-center border-t hover:bg-muted/30 transition-colors group"
              >
                <span className="text-center text-sm font-semibold text-muted-foreground">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge className={`${cfg.color} border-0 font-medium text-[10px] px-1.5 py-0`}>
                    {cfg.label}
                  </Badge>
                </div>
                <span className="text-sm font-medium truncate pr-2">{lesson.title}</span>
                <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{lesson.duration}m</span>
                </div>
                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {onReorder && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() => onReorder(lesson.id, 'up')}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={idx === sorted.length - 1}
                        onClick={() => onReorder(lesson.id, 'down')}
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(lesson)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive/70 hover:text-destructive"
                    onClick={() => setConfirmDelete(lesson.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Delete Confirm Inline */}
                {confirmDelete === lesson.id && (
                  <div className="col-span-5 bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-destructive">{t('confirmDeleteLesson')}</span>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setConfirmDelete(null)}>
                        {t('cancel')}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          onDelete(lesson.id);
                          setConfirmDelete(null);
                        }}
                      >
                        {t('deleteCourse')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
