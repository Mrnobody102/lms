'use client';

import { useParams } from 'next/navigation';
import { Award, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StudentNav } from '@/components/layout/student-nav';
import { useCertificateVerification } from '@/hooks/use-certificates';

export default function CertificateVerificationPage() {
  const t = useTranslations('Student');
  const params = useParams();
  const codeParam = params.code;
  const code = (Array.isArray(codeParam) ? codeParam[0] : codeParam) ?? '';
  const { data, isLoading, isError } = useCertificateVerification(code);

  return (
    <div className="min-h-screen bg-background font-sans">
      <StudentNav showLinks />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <section className="rounded-lg border bg-card p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">{t('certificate.verifyBadge')}</p>
              <h1 className="text-2xl font-bold tracking-tight">{t('certificate.verifyTitle')}</h1>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('certificate.verifyLoading')}
            </div>
          ) : isError || !data ? (
            <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-4 text-destructive">
              <XCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">{t('certificate.verifyNotFound')}</p>
                <p className="mt-1 text-sm">{t('certificate.verifyNotFoundDesc')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">
                    {data.isValid ? t('certificate.verifyValid') : t('certificate.verifyRevoked')}
                  </p>
                  <p className="mt-1 text-sm">{data.certificateCode}</p>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                <CertificateFact label={t('certificate.learner')} value={data.user.fullName} />
                <CertificateFact label={t('certificate.course')} value={data.course.title} />
                <CertificateFact label={t('certificate.tenant')} value={data.tenant.name} />
                <CertificateFact
                  label={t('certificate.issuedAt')}
                  value={new Date(data.issuedAt).toLocaleDateString()}
                />
              </dl>

              <a
                href={data.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                {t('certificate.image')}
              </a>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function CertificateFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-sm font-bold">{value}</dd>
    </div>
  );
}
