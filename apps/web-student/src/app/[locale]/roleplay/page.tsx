'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { ArrowRight, Bot, MessageSquare, Mic, PlayCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { StudentNav } from '@/components/layout/student-nav';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  RoleplayMode,
  RoleplayScenario,
  useCreateRoleplaySession,
  useGetAvailableRoleplayScenarios,
  useGetRoleplaySessions,
} from '@/features/roleplay/api/use-roleplay';
import { Link, useRouter } from '@/navigation';

export default function RoleplayDashboard() {
  const t = useTranslations('Student');
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [page, setPage] = useState(1);
  const limit = 9;
  const { data: response, isLoading } = useGetRoleplaySessions({ page, limit }, isAuthenticated);
  const { data: scenarioResponse, isLoading: scenariosLoading } =
    useGetAvailableRoleplayScenarios(isAuthenticated);
  const { mutate: createSession, isPending } = useCreateRoleplaySession();
  const sessions = response?.data || [];
  const scenarios = scenarioResponse?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const handleCreate = (scenario: RoleplayScenario, mode: RoleplayMode) => {
    createSession(
      { scenarioId: scenario.id, mode },
      {
        onSuccess: (data) => router.push(`/roleplay/${data.id}`),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {isInitialized && !isAuthenticated ? (
          <AuthRequiredPanel returnTo="/roleplay" />
        ) : (
          <>
            <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-primary">
                  <Bot className="h-5 w-5" />
                  <p className="text-sm font-semibold uppercase tracking-wider">
                    {t('roleplay.badge')}
                  </p>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{t('roleplay.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {t('roleplay.description')}
                </p>
              </div>
            </header>

            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('roleplay.availableScenarios')}</h2>
                {scenariosLoading ? (
                  <span className="text-sm text-muted-foreground">
                    {t('roleplay.loadingSessions')}
                  </span>
                ) : null}
              </div>
              {scenarios.length === 0 && !scenariosLoading ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                  {t('roleplay.noScenarios')}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {scenarios.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      isPending={isPending}
                      onStart={handleCreate}
                    />
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-4 text-lg font-semibold">{t('roleplay.recentSessions')}</h2>
              {!isInitialized || isLoading ? (
                <div className="flex justify-center py-20">
                  <span className="animate-pulse">{t('roleplay.loadingSessions')}</span>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex flex-col rounded-lg border bg-card p-5 transition-colors hover:border-primary/40"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <MessageSquare className="h-5 w-5" />
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              session.status === 'COMPLETED'
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {t(`roleplay.status.${session.status}`)}
                          </span>
                        </div>
                        <p className="mb-4 line-clamp-3 flex-1 text-sm font-medium text-card-foreground/90">
                          &quot;{session.scenario}&quot;
                        </p>
                        {session.score !== null && session.score !== undefined ? (
                          <p className="mb-4 text-sm font-bold text-primary">
                            {t('roleplay.score', { score: session.score })}
                          </p>
                        ) : null}
                        <Link
                          href={`/roleplay/${session.id}`}
                          className="group inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80"
                        >
                          {session.status === 'COMPLETED'
                            ? t('roleplay.viewFeedback')
                            : t('roleplay.resumeConversation')}
                          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </div>
                    ))}

                    {sessions.length === 0 ? (
                      <div className="col-span-full rounded-lg border border-dashed py-12 text-center">
                        <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
                        <h3 className="mb-2 text-lg font-semibold">{t('roleplay.emptyTitle')}</h3>
                        <p className="text-muted-foreground">{t('roleplay.emptyDescription')}</p>
                      </div>
                    ) : null}
                  </div>

                  {totalPages > 1 ? (
                    <div className="mt-8 flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        {t('roleplay.previous')}
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {t('roleplay.pageCount', { page, totalPages })}
                      </span>
                      <Button
                        variant="outline"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        {t('roleplay.next')}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function ScenarioCard({
  scenario,
  isPending,
  onStart,
}: {
  scenario: RoleplayScenario;
  isPending: boolean;
  onStart: (scenario: RoleplayScenario, mode: RoleplayMode) => void;
}) {
  const t = useTranslations('Student');
  const [mode, setMode] = useState<RoleplayMode>(
    scenario.mode === 'MIXED' ? 'TEXT' : scenario.mode,
  );
  const allowedModes: RoleplayMode[] =
    scenario.mode === 'MIXED' ? ['TEXT', 'AUDIO'] : [scenario.mode];

  return (
    <article className="rounded-lg border bg-card p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{scenario.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {scenario.course?.title}
            {scenario.unit ? ` · ${scenario.unit.title}` : ''}
          </p>
        </div>
        {scenario.mode !== 'TEXT' ? <Mic className="h-4 w-4 text-primary" /> : null}
      </div>
      {scenario.description ? (
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{scenario.description}</p>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {allowedModes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              mode === item ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground'
            }`}
          >
            {t(`roleplay.mode.${item}`)}
          </button>
        ))}
      </div>
      <Button className="w-full gap-2" disabled={isPending} onClick={() => onStart(scenario, mode)}>
        <PlayCircle className="h-4 w-4" />
        {isPending ? t('roleplay.starting') : t('roleplay.startScenario')}
      </Button>
    </article>
  );
}
