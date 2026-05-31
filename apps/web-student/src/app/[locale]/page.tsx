import { ArrowRight, BookOpenCheck, KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { useLocale, useTranslations } from 'next-intl';
import { ThemeToggle, LanguageToggle } from '@repo/ui';
import { Link } from '../../navigation';
import { serverApi } from '../../lib/server-api';
import LearningDashboard from '../../components/dashboard/learning-dashboard';

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = Boolean(cookieStore.get('access_token')?.value);

  if (hasSession) {
    const data = await serverApi.getStudentToday();
    if (data) {
      return <LearningDashboard data={data} />;
    }
  }

  return <GuestStudentHome />;
}

function GuestStudentHome() {
  const t = useTranslations('Student.guestHome');
  const locale = useLocale();
  const salesBaseUrl = (process.env.NEXT_PUBLIC_WEB_SALES_URL ?? 'http://localhost:3103').replace(
    /\/+$/,
    '',
  );

  return (
    <main className="min-h-screen bg-background font-sans relative">
      <header className="absolute top-0 w-full p-6 flex justify-end gap-3 z-10">
        <ThemeToggle label={t('themeToggle')} />
        <LanguageToggle />
      </header>
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center mt-12 lg:mt-0">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 text-sm font-semibold text-primary">
              <ShieldCheck className="h-4 w-4" />
              {t('badge')}
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{t('title')}</h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              {t('subtitle')}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                <LogIn className="h-4 w-4" />
                {t('loginCta')}
              </Link>
              <Link
                href="/activation"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold hover:bg-muted"
              >
                <KeyRound className="h-4 w-4" />
                {t('activationCta')}
              </Link>
              <a
                href={`${salesBaseUrl}/${locale}/courses`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-md border px-5 text-sm font-semibold hover:bg-muted"
              >
                {t('salesCta')}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <aside className="rounded-md border bg-card p-6 shadow-sm">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">{t('panelTitle')}</h2>
            <div className="mt-5 space-y-4">
              <StudentBenefit title={t('benefitDashboard')} text={t('benefitDashboardDesc')} />
              <StudentBenefit title={t('benefitPractice')} text={t('benefitPracticeDesc')} />
              <StudentBenefit title={t('benefitProgress')} text={t('benefitProgressDesc')} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function StudentBenefit({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
