'use client';

import { useState } from 'react';
import { StudentNav } from '@/components/layout/student-nav';
import { AuthRequiredPanel } from '@/components/auth/auth-required-panel';
import { Link, useRouter } from '@/navigation';
import { ArrowRight, Bot, MessageSquare, PlayCircle, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui';
import { useAuthStore } from '@/features/auth/auth.store';
import {
  useCreateRoleplaySession,
  useGetRoleplaySessions,
} from '@/features/roleplay/api/use-roleplay';

const PREDEFINED_SCENARIOS = ['hotel', 'interview', 'coffee', 'friends'] as const;
type PredefinedScenarioKey = (typeof PREDEFINED_SCENARIOS)[number];

export default function RoleplayDashboard() {
  const t = useTranslations('Student');
  const router = useRouter();
  const { isAuthenticated, isInitialized } = useAuthStore();
  const [page, setPage] = useState(1);
  const limit = 9;
  const { data: response, isLoading } = useGetRoleplaySessions({ page, limit }, isAuthenticated);
  const { mutate: createSession, isPending } = useCreateRoleplaySession();

  const sessions = response?.data || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customScenario, setCustomScenario] = useState('');

  const handleCreate = (scenario: string) => {
    createSession(scenario, {
      onSuccess: (data) => {
        setIsDialogOpen(false);
        router.push(`/roleplay/${data.id}`);
      },
    });
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
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Bot className="w-5 h-5" />
                  <p className="text-sm font-semibold uppercase tracking-wider">
                    {t('roleplay.badge')}
                  </p>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">{t('roleplay.title')}</h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                  {t('roleplay.description')}
                </p>
              </div>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                {t('roleplay.newSession')}
              </Button>
            </header>

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
                      className="border rounded-xl p-5 bg-card hover:border-primary/40 transition-colors flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${session.status === 'COMPLETED' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 text-primary'}`}
                        >
                          {t(`roleplay.status.${session.status}`)}
                        </span>
                      </div>
                      <p className="text-sm line-clamp-3 mb-4 flex-1 text-card-foreground/90 font-medium">
                        &quot;{session.scenario}&quot;
                      </p>
                      {session.score !== null && session.score !== undefined && (
                        <p className="text-sm font-bold text-primary mb-4">
                          {t('roleplay.score', { score: session.score })}
                        </p>
                      )}
                      <Link
                        href={`/roleplay/${session.id}`}
                        className="inline-flex items-center text-sm font-semibold text-primary hover:text-primary/80 group"
                      >
                        {session.status === 'COMPLETED'
                          ? t('roleplay.viewFeedback')
                          : t('roleplay.resumeConversation')}
                        <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  ))}

                  {sessions.length === 0 && (
                    <div className="col-span-full py-12 text-center border rounded-xl border-dashed">
                      <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">{t('roleplay.emptyTitle')}</h3>
                      <p className="text-muted-foreground mb-4">{t('roleplay.emptyDescription')}</p>
                      <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                        {t('roleplay.startPracticing')}
                      </Button>
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center items-center gap-4">
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
                )}
              </>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t('roleplay.dialogTitle')}</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <p className="text-sm text-muted-foreground">{t('roleplay.dialogDescription')}</p>
                  <div className="grid gap-2">
                    {PREDEFINED_SCENARIOS.map((scenarioKey: PredefinedScenarioKey) => {
                      const scenario = t(`roleplay.scenarios.${scenarioKey}`);
                      return (
                        <button
                          key={scenarioKey}
                          onClick={() => handleCreate(scenario)}
                          disabled={isPending}
                          className="text-left px-4 py-3 border rounded-lg text-sm hover:border-primary hover:bg-primary/5 transition-colors group flex justify-between items-center"
                        >
                          <span className="line-clamp-1">{scenario}</span>
                          <PlayCircle className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2" />
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">{t('roleplay.customScenario')}</p>
                    <textarea
                      placeholder={t('roleplay.customScenarioPlaceholder')}
                      value={customScenario}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCustomScenario(e.target.value)
                      }
                      className="min-h-[100px] mb-4 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <Button
                      onClick={() => handleCreate(customScenario)}
                      disabled={!customScenario.trim() || isPending}
                      className="w-full"
                    >
                      {isPending ? t('roleplay.starting') : t('roleplay.startCustom')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
}
