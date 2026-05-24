'use client';

import { Award, ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCourseCertificateStatus, useIssueCourseCertificate } from '@/hooks/use-certificates';
import { Link } from '@/navigation';

interface CourseCertificatePanelProps {
  courseId: string;
}

export function CourseCertificatePanel({ courseId }: CourseCertificatePanelProps) {
  const t = useTranslations('Student');
  const { data, isLoading, isError } = useCourseCertificateStatus(courseId);
  const issueCertificate = useIssueCourseCertificate(courseId);

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
        {t('certificate.loading')}
      </div>
    );
  }

  if (isError || !data || (!data.eligible && !data.certificate)) {
    return null;
  }

  const certificate = data.certificate;

  return (
    <section className="rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
            <Award className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight">{t('certificate.title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {certificate
                ? t('certificate.issuedDesc', { code: certificate.certificateCode })
                : t('certificate.readyDesc')}
            </p>
          </div>
        </div>

        {certificate ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/certificates/${certificate.certificateCode}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted"
            >
              <ExternalLink className="h-4 w-4" />
              {t('certificate.verify')}
            </Link>
            <a
              href={certificate.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Award className="h-4 w-4" />
              {t('certificate.image')}
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => issueCertificate.mutate()}
            disabled={issueCertificate.isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {issueCertificate.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Award className="h-4 w-4" />
            )}
            {t('certificate.issue')}
          </button>
        )}
      </div>
    </section>
  );
}
