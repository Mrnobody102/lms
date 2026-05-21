'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Link } from '@/navigation';

interface AdminHeaderProps {
  title: string;
  description?: string;
  showCreateCourse?: boolean;
}

export function AdminHeader({ title, description, showCreateCourse = false }: AdminHeaderProps) {
  const t = useTranslations('Admin');

  return (
    <header className="sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center py-4 mb-8 gap-4 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
          {title}
        </h1>
        {description && <p className="text-muted-foreground font-medium text-sm">{description}</p>}
      </div>
      <div className="w-full md:w-auto self-end md:self-auto">
        {showCreateCourse && (
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            {t('createCourse')}
          </Link>
        )}
      </div>
    </header>
  );
}
