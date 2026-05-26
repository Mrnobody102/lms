import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';

type OperationalTone = 'default' | 'destructive';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ action, className, description, icon: Icon, title }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-10 text-center', className)}>
      <div className="mb-3 rounded-lg border bg-muted/40 p-3 text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {description ? (
        <div className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export interface LoadingStateProps {
  title: string;
  className?: string;
}

export function LoadingState({ className, title }: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 px-6 py-10 text-sm font-medium text-muted-foreground',
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-primary" />
      {title}
    </div>
  );
}

export interface ErrorStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  icon?: LucideIcon;
  tone?: OperationalTone;
}

export function ErrorState({
  action,
  className,
  description,
  icon: Icon = AlertCircle,
  title,
  tone = 'destructive',
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-md border px-4 py-3 text-sm',
        tone === 'destructive'
          ? 'border-destructive/20 bg-destructive/5 text-destructive'
          : 'border-border bg-muted/30 text-foreground',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        {description ? (
          <div
            className={cn(
              'mt-1',
              tone === 'destructive' ? 'text-destructive/80' : 'text-muted-foreground',
            )}
          >
            {description}
          </div>
        ) : null}
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </div>
  );
}
