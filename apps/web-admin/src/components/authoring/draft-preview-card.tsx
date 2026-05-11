'use client';

import { AlertCircle, CheckCircle2, FileCheck2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui';

export interface DraftPreviewRow {
  label: string;
  value: number | string;
}

export interface DraftChecklistItem {
  label: string;
  ok: boolean;
}

interface DraftPreviewCardProps {
  title: string;
  ready: boolean;
  rows: DraftPreviewRow[];
  checklist: DraftChecklistItem[];
}

export function DraftPreviewCard({ title, ready, rows, checklist }: DraftPreviewCardProps) {
  const t = useTranslations('Admin');

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileCheck2 className="h-4 w-4" />
          </div>
          <h2 className="truncate text-base font-semibold">{title}</h2>
        </div>
        <Badge variant={ready ? 'success' : 'outline'}>
          {ready ? t('readyToSave') : t('needsAttention')}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{row.label}</p>
            <p className="mt-1 truncate text-sm font-semibold">{String(row.value).trim() || '-'}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t('validationChecklist')}
        </p>
        <div className="grid gap-2">
          {checklist.map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm">
              {item.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              )}
              <span className="min-w-0 truncate">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
