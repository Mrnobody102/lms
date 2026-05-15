'use client';

import { useState } from 'react';
import { Button } from '@/components/ui';
import { Download, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { reportsApi } from '@/lib/reports-api';

interface CsvDownloadButtonProps {
  path: string;
  filename: string;
  disabled?: boolean;
}

export function CsvDownloadButton({ path, filename, disabled }: CsvDownloadButtonProps) {
  const t = useTranslations('Admin');
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await reportsApi.downloadCsv(path, filename);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled || loading}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-1.5" />
      )}
      {t('reports.downloadCsv')}
    </Button>
  );
}
