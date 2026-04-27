'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CourseUnit, Lesson } from '@/lib/course-api';
import {
  Video,
  FileText,
  HelpCircle,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Layers,
  FolderPlus,
  Save,
  X,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';

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
  units?: CourseUnit[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onAddClick: (unitId?: string | null) => void;
  onAddUnit?: (data: { title: string; order?: number }) => Promise<boolean>;
  onUpdateUnit?: (unitId: string, data: { title?: string; order?: number }) => Promise<boolean>;
  onDeleteUnit?: (unitId: string) => void;
  onReorder?: (lessonId: string, direction: 'up' | 'down') => void;
}

export function LessonList({
  lessons,
  units = [],
  onEdit,
  onDelete,
  onAddClick,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onReorder,
}: LessonListProps) {
  const t = useTranslations('Admin');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState<string | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState<{ id: string; title: string } | null>(null);

  const sortedLessons = useMemo(() => [...lessons].sort(sortByOrder), [lessons]);
  const sortedUnits = useMemo(() => [...units].sort(sortByOrder), [units]);
  const groupedLessonIds = new Set(
    sortedUnits.flatMap((unit) => (unit.lessons ?? []).map((lesson) => lesson.id)),
  );
  const ungroupedLessons = sortedLessons.filter(
    (lesson) => !lesson.unitId || !groupedLessonIds.has(lesson.id),
  );
  const totalLessons = sortedLessons.length;

  const handleAddUnit = async () => {
    if (!newUnitTitle.trim() || !onAddUnit) return;

    const success = await onAddUnit({
      title: newUnitTitle.trim(),
      order: sortedUnits.length,
    });

    if (success) {
      setNewUnitTitle('');
      setIsAddingUnit(false);
    }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit?.title.trim() || !onUpdateUnit) return;

    const success = await onUpdateUnit(editingUnit.id, { title: editingUnit.title.trim() });
    if (success) {
      setEditingUnit(null);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-base">{t('curriculum')}</h3>
          <Badge variant="secondary" className="text-xs">
            {totalLessons}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {onAddUnit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddingUnit(true)}
              className="gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              {t('newUnit')}
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onAddClick(sortedUnits[0]?.id ?? null)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {t('newLesson')}
          </Button>
        </div>
      </div>

      {isAddingUnit && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border bg-muted/20 p-3">
          <Input
            value={newUnitTitle}
            onChange={(event) => setNewUnitTitle(event.target.value)}
            placeholder={t('unitTitlePlaceholder')}
            className="h-9"
            autoFocus
          />
          <Button size="sm" onClick={handleAddUnit} disabled={!newUnitTitle.trim()}>
            <Save className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setNewUnitTitle('');
              setIsAddingUnit(false);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {totalLessons === 0 && sortedUnits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-lg">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <Layers className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{t('noLessons')}</p>
          <p className="text-xs text-muted-foreground mb-4">{t('startBuildingDesc')}</p>
          <Button size="sm" variant="outline" onClick={() => onAddClick(null)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            {t('addLessonTitle')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedUnits.map((unit) => (
            <section key={unit.id} className="overflow-hidden rounded-lg border">
              <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                {editingUnit?.id === unit.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <Input
                      value={editingUnit.title}
                      onChange={(event) =>
                        setEditingUnit({ id: unit.id, title: event.target.value })
                      }
                      className="h-9"
                    />
                    <Button
                      size="sm"
                      onClick={handleUpdateUnit}
                      disabled={!editingUnit.title.trim()}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingUnit(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold">{unit.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {t('unitLessonCount', { count: unit.lessons?.length ?? 0 })}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onAddClick(unit.id)}
                        className="gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t('newLesson')}
                      </Button>
                      {onUpdateUnit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingUnit({ id: unit.id, title: unit.title })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                      {onDeleteUnit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive/70 hover:text-destructive"
                          onClick={() => setConfirmDeleteUnit(unit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {confirmDeleteUnit === unit.id && (
                <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/5 p-3">
                  <span className="text-sm text-destructive">{t('confirmDeleteUnit')}</span>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => setConfirmDeleteUnit(null)}>
                      {t('cancel')}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        onDeleteUnit?.(unit.id);
                        setConfirmDeleteUnit(null);
                      }}
                    >
                      {t('deleteUnit')}
                    </Button>
                  </div>
                </div>
              )}

              <LessonRows
                lessons={[...(unit.lessons ?? [])].sort(sortByOrder)}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onEdit={onEdit}
                onDelete={onDelete}
                onReorder={onReorder}
                t={t}
              />
            </section>
          ))}

          {ungroupedLessons.length > 0 && (
            <section className="overflow-hidden rounded-lg border border-dashed">
              <div className="flex items-center justify-between border-b bg-muted/20 px-4 py-3">
                <div>
                  <h4 className="text-sm font-semibold">{t('ungroupedLessons')}</h4>
                  <p className="text-xs text-muted-foreground">
                    {t('unitLessonCount', { count: ungroupedLessons.length })}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAddClick(null)}
                  className="gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t('newLesson')}
                </Button>
              </div>
              <LessonRows
                lessons={ungroupedLessons}
                confirmDelete={confirmDelete}
                setConfirmDelete={setConfirmDelete}
                onEdit={onEdit}
                onDelete={onDelete}
                onReorder={onReorder}
                t={t}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function LessonRows({
  lessons,
  confirmDelete,
  setConfirmDelete,
  onEdit,
  onDelete,
  onReorder,
  t,
}: {
  lessons: Lesson[];
  confirmDelete: string | null;
  setConfirmDelete: (lessonId: string | null) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onReorder?: (lessonId: string, direction: 'up' | 'down') => void;
  t: ReturnType<typeof useTranslations>;
}) {
  if (lessons.length === 0) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">{t('noLessonsInUnit')}</div>;
  }

  return (
    <div>
      <div className="grid grid-cols-[2rem_7rem_1fr_5rem_6rem] gap-2 px-4 py-2.5 bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="text-center">#</span>
        <span>Type</span>
        <span>Title</span>
        <span className="text-right">Duration</span>
        <span className="text-right">Actions</span>
      </div>
      {lessons.map((lesson, idx) => {
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
                    <ChevronUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={idx === lessons.length - 1}
                    onClick={() => onReorder(lesson.id, 'down')}
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
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
  );
}

function sortByOrder<T extends { order: number; createdAt?: string }>(a: T, b: T) {
  return a.order - b.order;
}
