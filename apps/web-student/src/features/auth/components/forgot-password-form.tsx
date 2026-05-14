'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Mail, CheckCircle2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button, Input, Label } from '@repo/ui';
import { defaultApiClient } from '@repo/api-client';

export function ForgotPasswordForm() {
  const t = useTranslations('Student');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await defaultApiClient.post('/auth/forgot-password', { email, locale });
      setSuccess(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="flex justify-center">
          <div className="bg-green-500/10 p-3 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">{t('auth.forgotEmailSent')}</h3>
          <p className="text-muted-foreground">{t('auth.forgotEmailSentDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} data-hydrated={isHydrated} className="space-y-7">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <Label>{t('auth.email')}</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('auth.emailPlaceholder')}
            className="pl-10"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('auth.sendingLink')}</span>
          </>
        ) : (
          <span>{t('auth.sendResetLink')}</span>
        )}
      </Button>
    </form>
  );
}
