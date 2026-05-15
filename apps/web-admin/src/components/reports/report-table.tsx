'use client';

import { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface ReportTableProps<T> {
  rows: T[];
  columns: ReadonlyArray<{
    header: string;
    align?: 'left' | 'right' | 'center';
    render: (row: T) => ReactNode;
    className?: string;
  }>;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export function ReportTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  emptyMessage,
}: ReportTableProps<T>) {
  const t = useTranslations('Admin');
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground text-center">
        {emptyMessage ?? t('reports.noData')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 text-${col.align ?? 'left'} font-semibold text-xs uppercase tracking-wide text-muted-foreground`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={
                onRowClick
                  ? 'hover:bg-muted/40 cursor-pointer transition-colors'
                  : 'hover:bg-muted/40'
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={`px-4 py-3 text-${col.align ?? 'left'} ${col.className ?? ''}`}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface AccuracyCellProps {
  value: number;
  totalQuestions?: number;
}

export function AccuracyCell({ value, totalQuestions }: AccuracyCellProps) {
  const tone =
    value >= 80
      ? 'text-emerald-600 dark:text-emerald-400'
      : value >= 50
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-rose-600 dark:text-rose-400';

  if (totalQuestions !== undefined && totalQuestions === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  return <span className={`font-semibold ${tone}`}>{value}%</span>;
}

export function ProgressBarCell({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-medium text-foreground tabular-nums w-10 text-right">
        {value}%
      </span>
    </div>
  );
}
