import { Wrench } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export default async function MaintenancePage(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations('Maintenance');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-8">
        <Wrench className="h-10 w-10 text-primary" />
      </div>
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        {t('title')}
      </h1>
      <p className="mx-auto max-w-lg text-lg text-muted-foreground">{t('description')}</p>
    </div>
  );
}
