'use client';

import { ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Button,
} from '@repo/ui';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { useSkillMastery } from '@/hooks/use-skills';
import type { SkillMasterySnapshot } from '@/lib/skill-api';

const MAX_VISIBLE = 5;

function formatPercent(mastery: number) {
  const pct = Math.max(0, Math.min(1, mastery)) * 100;
  return Math.round(pct);
}

function masteryLabel(mastery: number) {
  if (mastery < 0.3) return 'weak';
  if (mastery < 0.7) return 'progressing';
  return 'strong';
}

function displayName(snapshot: SkillMasterySnapshot, locale: string) {
  if (snapshot.skill) {
    if (locale.startsWith('vi') && snapshot.skill.nameVi) return snapshot.skill.nameVi;
    return snapshot.skill.name;
  }
  return snapshot.skillCode;
}

export function SkillMasteryPanel({ locale }: { locale: string }) {
  const t = useTranslations('Student.skillMastery');
  const { data, isLoading, error } = useSkillMastery();

  if (isLoading) {
    return <div className="h-44 rounded-2xl bg-card animate-pulse border border-border/50" />;
  }

  if (error || !data || data.length === 0) {
    return null;
  }

  const visible = data.slice(0, MAX_VISIBLE);

  return (
    <section className="rounded-2xl bg-card border border-border/50 p-5 sm:p-6">
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold tracking-tight">{t('title')}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t('subtitle')}</p>
          </div>
        </div>
      </header>

      <ul className="space-y-3">
        {visible.map((entry) => {
          const pct = formatPercent(entry.mastery);
          const label = masteryLabel(entry.mastery);
          const color = entry.skill?.color || '#94a3b8';
          return (
            <li key={entry.id} className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {displayName(entry, locale)}
                    </span>
                    {entry.mastery < 0.7 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            className="text-muted-foreground hover:text-primary transition-colors focus:outline-none shrink-0"
                            aria-label={t('explainWeakness')}
                          >
                            <HelpCircle className="h-3.5 w-3.5" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[400px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              {displayName(entry, locale)}
                            </DialogTitle>
                            <DialogDescription className="text-left mt-2 whitespace-pre-line text-sm text-foreground">
                              {entry.skill?.description || t('noDescription')}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50">
                            <h4 className="text-sm font-medium mb-1">{t('weaknessTip')}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t('attempts', { count: entry.attempts })}. {t(`label.${label}`)}.
                            </p>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <Button asChild>
                              <Link
                                href={{ pathname: '/practice', query: { skill: entry.skillCode } }}
                              >
                                {t('practiceNow')}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                    {pct}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">
                  {t(`label.${label}`)} · {t('attempts', { count: entry.attempts })}
                </div>
              </div>
              <Link
                href={{ pathname: '/practice', query: { skill: entry.skillCode } }}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0"
              >
                {t('practiceNow')}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
