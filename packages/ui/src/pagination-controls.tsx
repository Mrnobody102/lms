'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './lib/utils';

export interface PaginationControlsLabels {
  previous: string;
  next: string;
  pageValue: string;
}

export interface PaginationControlsProps {
  page: number;
  totalPages: number;
  labels: PaginationControlsLabels;
  disabled?: boolean;
  className?: string;
  onPageChange: (page: number) => void;
}

export function PaginationControls({
  page,
  totalPages,
  labels,
  disabled = false,
  className,
  onPageChange,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  const canGoPrevious = page > 1 && !disabled;
  const canGoNext = page < safeTotalPages && !disabled;

  return (
    <div className={cn('flex items-center justify-between gap-3', className)}>
      <button
        type="button"
        disabled={!canGoPrevious}
        onClick={() => onPageChange(page - 1)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-4 w-4" />
        {labels.previous}
      </button>
      <span className="min-w-0 truncate text-sm text-muted-foreground">{labels.pageValue}</span>
      <button
        type="button"
        disabled={!canGoNext}
        onClick={() => onPageChange(page + 1)}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {labels.next}
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
