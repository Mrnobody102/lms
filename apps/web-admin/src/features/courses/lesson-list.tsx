'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CourseUnit, Lesson, LessonType } from '@/lib/course-api';
import {
  Video,
  FileText,
  HelpCircle,
  Bot,
  LayoutGrid,
  Plus,
  Pencil,
  Trash2,
  Clock,
  Layers,
  FolderPlus,
  Save,
  X,
  Copy,
  ExternalLink,
  Loader2,
  GripVertical,
} from 'lucide-react';
import { Button, Badge, Input } from '@/components/ui';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function getTypeConfig(t: ReturnType<typeof useTranslations>) {
  return {
    video: {
      icon: Video,
      label: t('lessonTypeVideo'),
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    },
    text: {
      icon: FileText,
      label: t('lessonTypeText'),
      color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    },
    quiz: {
      icon: HelpCircle,
      label: t('lessonTypeQuiz'),
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    },
    simulation: {
      icon: Bot,
      label: t('lessonTypeSimulation'),
      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    },
    micro_card: {
      icon: LayoutGrid,
      label: t('lessonTypeMicroCard'),
      color: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
    },
  } as const;
}

interface LessonListProps {
  lessons: Lesson[];
  units?: CourseUnit[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onBulkDelete?: (lessonIds: string[]) => Promise<void>;
  onAddClick: (unitId?: string | null) => void;
  onAddUnit?: (data: { title: string; order?: number }) => Promise<boolean>;
  onUpdateUnit?: (unitId: string, data: { title?: string; order?: number }) => Promise<boolean>;
  onDeleteUnit?: (unitId: string) => void;
  onDuplicateUnit?: (unit: CourseUnit) => void;
  onReorderUnit?: (activeId: string, overId: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
  onDuplicate?: (lesson: Lesson) => void;
  getPreviewUrl?: (lesson: Lesson) => string | null;
}

type LessonStatusFilter = 'all' | 'ready' | 'draft';

function includesNormalized(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function LessonList({
  lessons,
  units = [],
  onEdit,
  onDelete,
  onBulkDelete,
  onAddClick,
  onAddUnit,
  onUpdateUnit,
  onDeleteUnit,
  onDuplicateUnit,
  onReorderUnit,
  onReorder,
  onDuplicate,
  getPreviewUrl,
}: LessonListProps) {
  const t = useTranslations('Admin');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState<string | null>(null);
  const [newUnitTitle, setNewUnitTitle] = useState('');
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState<{ id: string; title: string } | null>(null);
  const [lessonSearch, setLessonSearch] = useState('');
  const [lessonTypeFilter, setLessonTypeFilter] = useState<'all' | LessonType>('all');
  const [lessonStatusFilter, setLessonStatusFilter] = useState<LessonStatusFilter>('all');
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const sortedLessons = useMemo(() => [...lessons].sort(sortByOrder), [lessons]);
  const sortedUnits = useMemo(() => [...units].sort(sortByOrder), [units]);

  const hasActiveFilters =
    Boolean(lessonSearch.trim()) || lessonTypeFilter !== 'all' || lessonStatusFilter !== 'all';

  const filteredLessons = useMemo(() => {
    const search = lessonSearch.trim();
    return sortedLessons.filter((lesson) => {
      const status = getLessonStatus(lesson);
      const typeMatches = lessonTypeFilter === 'all' || lesson.type === lessonTypeFilter;
      const statusMatches = lessonStatusFilter === 'all' || status === lessonStatusFilter;
      const textMatches =
        !search ||
        includesNormalized(lesson.title, search) ||
        includesNormalized(getLessonSummary(lesson, t) ?? '', search);
      return typeMatches && statusMatches && textMatches;
    });
  }, [lessonSearch, lessonStatusFilter, lessonTypeFilter, sortedLessons, t]);

  const lessonGroups = useMemo(
    () =>
      sortedUnits
        .map((unit) => ({
          unit,
          lessons: getLessonsForUnit(unit, filteredLessons),
        }))
        .filter((group) => !hasActiveFilters || group.lessons.length > 0),
    [filteredLessons, hasActiveFilters, sortedUnits],
  );

  const groupedLessonIds = new Set(
    lessonGroups.flatMap((group) => group.lessons.map((lesson) => lesson.id)),
  );
  const ungroupedLessons = filteredLessons.filter((lesson) => !groupedLessonIds.has(lesson.id));
  const totalLessons = sortedLessons.length;
  const visibleLessons = filteredLessons.length;
  const readyLessonCount = sortedLessons.filter(
    (lesson) => getLessonStatus(lesson) === 'ready',
  ).length;
  const selectedLessons = sortedLessons.filter((lesson) => selectedLessonIds.includes(lesson.id));

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

  const toggleLessonSelection = (lessonId: string, checked: boolean) => {
    setSelectedLessonIds((current) =>
      checked
        ? current.includes(lessonId)
          ? current
          : [...current, lessonId]
        : current.filter((id) => id !== lessonId),
    );
  };

  const selectVisibleLessons = () => {
    setSelectedLessonIds(filteredLessons.map((lesson) => lesson.id));
  };

  const clearSelectedLessons = () => {
    setSelectedLessonIds([]);
  };

  const clearLessonFilters = () => {
    setLessonSearch('');
    setLessonTypeFilter('all');
    setLessonStatusFilter('all');
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedLessons.length === 0) return;

    setBulkDeleting(true);
    try {
      await onBulkDelete(selectedLessons.map((lesson) => lesson.id));
      setSelectedLessonIds([]);
      setConfirmBulkDelete(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleUnitDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorderUnit) {
      onReorderUnit(active.id.toString(), over.id.toString());
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
          <Badge variant="outline" className="text-xs">
            {t('readyLessonsValue', { count: readyLessonCount })}
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

      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <Input
          value={lessonSearch}
          onChange={(event) => setLessonSearch(event.target.value)}
          placeholder={t('searchLessons')}
        />
        <select
          value={lessonTypeFilter}
          onChange={(event) => setLessonTypeFilter(event.target.value as 'all' | LessonType)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('allLessonTypes')}</option>
          <option value="video">{t('lessonTypeVideo')}</option>
          <option value="text">{t('lessonTypeText')}</option>
          <option value="quiz">{t('lessonTypeQuiz')}</option>
          <option value="simulation">{t('lessonTypeSimulation')}</option>
          <option value="micro_card">{t('lessonTypeMicroCard')}</option>
        </select>
        <select
          value={lessonStatusFilter}
          onChange={(event) => setLessonStatusFilter(event.target.value as LessonStatusFilter)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="ready">{t('readyOnly')}</option>
          <option value="draft">{t('draftOnly')}</option>
        </select>
        <Button
          type="button"
          variant="ghost"
          onClick={clearLessonFilters}
          disabled={!hasActiveFilters}
        >
          {t('clearFilters')}
        </Button>
      </div>

      {selectedLessonIds.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
          <span className="text-sm font-medium">
            {t('selectedLessonsValue', { count: selectedLessonIds.length })}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={selectVisibleLessons}
              disabled={visibleLessons === 0}
            >
              {t('selectVisibleLessons')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={clearSelectedLessons}>
              {t('clearSelection')}
            </Button>
            {onBulkDelete && (
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setConfirmBulkDelete(true)}
              >
                {t('deleteSelected')}
              </Button>
            )}
          </div>
        </div>
      )}

      {confirmBulkDelete && selectedLessonIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <span className="text-sm text-destructive">
            {t('confirmBulkDeleteLessons', { count: selectedLessonIds.length })}
          </span>
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={() => setConfirmBulkDelete(false)}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
            >
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('deleteSelected')}
            </Button>
          </div>
        </div>
      )}

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
      ) : hasActiveFilters && visibleLessons === 0 ? (
        <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {t('noFilteredLessons')}
        </div>
      ) : (
        <div className="space-y-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleUnitDragEnd}
          >
            <SortableContext
              items={lessonGroups.map((g) => g.unit.id)}
              strategy={verticalListSortingStrategy}
            >
              {lessonGroups.map(({ unit, lessons: unitLessons }) => (
                <SortableUnit
                  key={unit.id}
                  unit={unit}
                  unitLessons={unitLessons}
                  editingUnit={editingUnit}
                  setEditingUnit={setEditingUnit}
                  onUpdateUnit={onUpdateUnit}
                  handleUpdateUnit={handleUpdateUnit}
                  onAddClick={onAddClick}
                  onDuplicateUnit={onDuplicateUnit}
                  onDeleteUnit={onDeleteUnit}
                  confirmDeleteUnit={confirmDeleteUnit}
                  setConfirmDeleteUnit={setConfirmDeleteUnit}
                  t={t}
                  onReorderUnit={onReorderUnit}
                  onReorder={onReorder}
                  confirmDelete={confirmDelete}
                  setConfirmDelete={setConfirmDelete}
                  selectedLessonIds={selectedLessonIds}
                  toggleLessonSelection={toggleLessonSelection}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  getPreviewUrl={getPreviewUrl}
                  sensors={sensors}
                />
              ))}
            </SortableContext>
          </DndContext>

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
                selectedLessonIds={selectedLessonIds}
                onToggleSelection={toggleLessonSelection}
                onEdit={onEdit}
                onDelete={onDelete}
                onReorder={onReorder}
                onDuplicate={onDuplicate}
                getPreviewUrl={getPreviewUrl}
                t={t}
                sensors={sensors}
              />
            </section>
          )}
        </div>
      )}
    </div>
  );
}

interface SortableUnitProps {
  unit: CourseUnit;
  unitLessons: Lesson[];
  editingUnit: { id: string; title: string } | null;
  setEditingUnit: (unit: { id: string; title: string } | null) => void;
  onUpdateUnit?: (unitId: string, data: { title?: string; order?: number }) => Promise<boolean>;
  handleUpdateUnit: () => Promise<void>;
  onAddClick: (unitId?: string | null) => void;
  onDuplicateUnit?: (unit: CourseUnit) => void;
  onDeleteUnit?: (unitId: string) => void;
  confirmDeleteUnit: string | null;
  setConfirmDeleteUnit: (id: string | null) => void;
  t: ReturnType<typeof useTranslations>;
  onReorderUnit?: (activeId: string, overId: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  selectedLessonIds: string[];
  toggleLessonSelection: (lessonId: string, checked: boolean) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onDuplicate?: (lesson: Lesson) => void;
  getPreviewUrl?: (lesson: Lesson) => string | null;
  sensors: ReturnType<typeof useSensors>;
}

function SortableUnit({
  unit,
  unitLessons,
  editingUnit,
  setEditingUnit,
  onUpdateUnit,
  handleUpdateUnit,
  onAddClick,
  onDuplicateUnit,
  onDeleteUnit,
  confirmDeleteUnit,
  setConfirmDeleteUnit,
  t,
  onReorderUnit,
  onReorder,
  confirmDelete,
  setConfirmDelete,
  selectedLessonIds,
  toggleLessonSelection,
  onEdit,
  onDelete,
  onDuplicate,
  getPreviewUrl,
  sensors,
}: SortableUnitProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: unit.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <section
      ref={setNodeRef}
      style={style}
      className={`overflow-hidden rounded-lg border ${isDragging ? 'shadow-xl ring-2 ring-primary/20 bg-background opacity-90' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        {editingUnit?.id === unit.id ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={editingUnit.title}
              onChange={(event) => setEditingUnit({ id: unit.id, title: event.target.value })}
              className="h-9"
            />
            <Button size="sm" onClick={handleUpdateUnit} disabled={!editingUnit.title.trim()}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditingUnit(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {onReorderUnit && (
                <div
                  {...attributes}
                  {...listeners}
                  className="cursor-grab hover:text-primary active:cursor-grabbing text-muted-foreground p-1"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              )}
              <div className="min-w-0">
                <h4 className="truncate text-sm font-semibold">{unit.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {t('unitLessonCount', { count: unitLessons.length })}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {onDuplicateUnit && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title={t('duplicateUnit')}
                  aria-label={t('duplicateUnit')}
                  onClick={() => onDuplicateUnit(unit)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
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
        lessons={unitLessons}
        confirmDelete={confirmDelete}
        setConfirmDelete={setConfirmDelete}
        selectedLessonIds={selectedLessonIds}
        onToggleSelection={toggleLessonSelection}
        onEdit={onEdit}
        onDelete={onDelete}
        onReorder={onReorder}
        onDuplicate={onDuplicate}
        getPreviewUrl={getPreviewUrl}
        t={t}
        sensors={sensors}
      />
    </section>
  );
}

function LessonRows({
  lessons,
  confirmDelete,
  setConfirmDelete,
  selectedLessonIds,
  onToggleSelection,
  onEdit,
  onDelete,
  onReorder,
  onDuplicate,
  getPreviewUrl,
  t,
  sensors,
}: {
  lessons: Lesson[];
  confirmDelete: string | null;
  setConfirmDelete: (lessonId: string | null) => void;
  selectedLessonIds: string[];
  onToggleSelection: (lessonId: string, checked: boolean) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onReorder?: (activeId: string, overId: string) => void;
  onDuplicate?: (lesson: Lesson) => void;
  getPreviewUrl?: (lesson: Lesson) => string | null;
  t: ReturnType<typeof useTranslations>;
  sensors: ReturnType<typeof useSensors>;
}) {
  if (lessons.length === 0) {
    return <div className="px-4 py-6 text-sm text-muted-foreground">{t('noLessonsInUnit')}</div>;
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      onReorder(active.id.toString(), over.id.toString());
    }
  };

  return (
    <div>
      <div className="grid grid-cols-[2rem_2rem_2rem_7rem_1fr_5rem_9.5rem] gap-2 px-4 py-2.5 bg-muted/20 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className="w-4" /> {/* spacer for drag handle */}
        <span className="text-center">{t('selectItem')}</span>
        <span className="text-center">#</span>
        <span>{t('type')}</span>
        <span>{t('title')}</span>
        <span className="text-right">{t('duration')}</span>
        <span className="text-right">{t('actions')}</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {lessons.map((lesson, idx) => (
            <SortableLesson
              key={lesson.id}
              lesson={lesson}
              idx={idx}
              confirmDelete={confirmDelete}
              setConfirmDelete={setConfirmDelete}
              selectedLessonIds={selectedLessonIds}
              onToggleSelection={onToggleSelection}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              getPreviewUrl={getPreviewUrl}
              t={t}
              onReorder={!!onReorder}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface SortableLessonProps {
  lesson: Lesson;
  idx: number;
  confirmDelete: string | null;
  setConfirmDelete: (id: string | null) => void;
  selectedLessonIds: string[];
  onToggleSelection: (lessonId: string, checked: boolean) => void;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
  onDuplicate?: (lesson: Lesson) => void;
  getPreviewUrl?: (lesson: Lesson) => string | null;
  t: ReturnType<typeof useTranslations>;
  onReorder: boolean;
}

function SortableLesson({
  lesson,
  idx,
  confirmDelete,
  setConfirmDelete,
  selectedLessonIds,
  onToggleSelection,
  onEdit,
  onDelete,
  onDuplicate,
  getPreviewUrl,
  t,
  onReorder,
}: SortableLessonProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lesson.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  const typeConfig = getTypeConfig(t);
  const cfg = typeConfig[lesson.type as keyof typeof typeConfig] ?? typeConfig.text;
  const summary = getLessonSummary(lesson, t);
  const previewUrl = getPreviewUrl?.(lesson) ?? null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`grid grid-cols-[2rem_2rem_2rem_7rem_1fr_5rem_9.5rem] gap-2 px-4 py-3 items-center border-t hover:bg-muted/30 transition-colors group ${
        isDragging ? 'shadow-lg ring-1 ring-primary/20 bg-background opacity-90' : ''
      }`}
    >
      <div className="flex items-center justify-center">
        {onReorder && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground p-1"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={selectedLessonIds.includes(lesson.id)}
          onChange={(event) => onToggleSelection(lesson.id, event.target.checked)}
          aria-label={t('selectItem')}
        />
      </div>
      <span className="text-center text-sm font-semibold text-muted-foreground">
        {String(idx + 1).padStart(2, '0')}
      </span>
      <div className="flex items-center gap-1.5">
        <Badge className={`${cfg.color} border-0 font-medium text-[10px] px-1.5 py-0`}>
          {cfg.label}
        </Badge>
      </div>
      <div className="min-w-0 pr-2">
        <p className="truncate text-sm font-medium">{lesson.title}</p>
        {summary && <p className="truncate text-xs text-muted-foreground">{summary}</p>}
      </div>
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
        <Clock className="w-3 h-3" />
        <span>{lesson.duration}m</span>
      </div>
      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {previewUrl && (
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={t('lessonPreview')}
            aria-label={t('lessonPreview')}
          >
            <a href={previewUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        )}
        {onDuplicate && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={t('duplicateLesson')}
            aria-label={t('duplicateLesson')}
            onClick={() => onDuplicate(lesson)}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          title={t('editLesson')}
          aria-label={t('editLesson')}
          onClick={() => onEdit(lesson)}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive/70 hover:text-destructive"
          title={t('deleteCourse')}
          aria-label={t('deleteCourse')}
          onClick={() => setConfirmDelete(lesson.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {confirmDelete === lesson.id && (
        <div className="col-span-7 bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-center justify-between gap-3 mt-2">
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
}

function getLessonsForUnit(unit: CourseUnit, sortedLessons: Lesson[]) {
  const fromFlat = sortedLessons.filter((lesson) => lesson.unitId === unit.id);
  const knownIds = new Set(fromFlat.map((lesson) => lesson.id));
  const fromUnit = (unit.lessons ?? []).filter((lesson) => !knownIds.has(lesson.id));

  return [...fromFlat, ...fromUnit].sort(sortByOrder);
}

function sortByOrder<T extends { order: number; createdAt?: string }>(a: T, b: T) {
  return a.order - b.order;
}

function getLessonSummary(lesson: Lesson, t: ReturnType<typeof useTranslations>) {
  if (lesson.type === 'video') {
    return lesson.videoUrl || t('lessonMissingContent');
  }

  if (lesson.type === 'text') {
    return lesson.content
      ? t('lessonContentLength', { count: lesson.content.length })
      : t('lessonMissingContent');
  }

  if (lesson.type === 'simulation') {
    return lesson.aiPrompt
      ? t('lessonContentLength', { count: lesson.aiPrompt.length })
      : t('lessonMissingContent');
  }

  if (lesson.type === 'micro_card') {
    const card = parseMicroCardSummary(lesson.content);
    return card ?? t('lessonMissingContent');
  }

  if (lesson.type === 'quiz') {
    const count = getQuizQuestionCount(lesson.quiz);
    return t('lessonQuizSummary', { count });
  }

  return null;
}

function parseMicroCardSummary(content: string | null | undefined) {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const front = typeof parsed.front === 'string' ? parsed.front.trim() : '';
    const back = typeof parsed.back === 'string' ? parsed.back.trim() : '';
    return front && back ? `${front} -> ${back}` : null;
  } catch {
    return null;
  }
}

function getQuizQuestionCount(quiz: unknown) {
  if (!quiz || typeof quiz !== 'object') return 0;

  const record = quiz as Record<string, unknown>;
  return Array.isArray(record.questions) ? record.questions.length : 0;
}

function getLessonStatus(lesson: Lesson): 'ready' | 'draft' {
  if (lesson.duration <= 0) return 'draft';

  if (lesson.type === 'video') {
    return lesson.videoUrl?.trim() ? 'ready' : 'draft';
  }

  if (lesson.type === 'text') {
    return lesson.content?.trim() ? 'ready' : 'draft';
  }

  if (lesson.type === 'simulation') {
    return lesson.aiPrompt?.trim() ? 'ready' : 'draft';
  }

  if (lesson.type === 'micro_card') {
    return parseMicroCardSummary(lesson.content) ? 'ready' : 'draft';
  }

  if (lesson.type === 'quiz') {
    return getQuizQuestionCount(lesson.quiz) > 0 ? 'ready' : 'draft';
  }

  return 'draft';
}
