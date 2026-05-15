import { useTranslations } from 'next-intl';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderingQuestionProps {
  options: string[];
  value: string; // JSON stringified string[]
  disabled: boolean;
  onChange: (value: string) => void;
}

export function OrderingQuestion({ options, value, disabled, onChange }: OrderingQuestionProps) {
  const t = useTranslations('Student');
  const [items, setItems] = useState<string[]>([]);

  // Initialize items from value or options
  useEffect(() => {
    let parsed: string[] = [];
    try {
      if (value) parsed = JSON.parse(value);
    } catch (_e) {
      // ignore
    }

    if (parsed.length === options.length) {
      setItems(parsed);
    } else {
      setItems([...options]);
      onChange(JSON.stringify([...options]));
    }
  }, [options, value, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onChange(JSON.stringify(newItems));
    }
  };

  return (
    <div className="mt-4">
      <p className="mb-4 text-sm text-muted-foreground">
        {t('practice.orderingInstruction', {
          fallback: 'Drag and drop items to put them in the correct order.',
        })}
      </p>

      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={disabled ? undefined : handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item, index) => (
              <SortableItem key={item} id={item} index={index} disabled={disabled} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableItem({ id, index, disabled }: { id: string; index: number; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 border rounded-md px-4 py-3 bg-card ${
        disabled ? 'opacity-70' : ''
      } ${isDragging ? 'shadow-md border-primary/50 opacity-90' : 'hover:border-primary/30'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`shrink-0 ${disabled ? 'cursor-not-allowed text-muted' : 'cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground'}`}
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex items-center justify-center shrink-0 w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
        {index + 1}
      </div>
      <span className="text-sm font-medium">{id}</span>
    </div>
  );
}
