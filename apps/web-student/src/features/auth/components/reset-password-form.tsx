'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@repo/ui';
import { defaultApiClient } from '@repo/api-client';

export function ResetPasswordForm() {
  const t = useTranslations('Student');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await defaultApiClient.post('/auth/reset-password', {
        token,
        newPassword: password,
      });
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
          <h3 className="text-xl font-bold">{t('auth.resetSuccess')}</h3>
          <p className="text-muted-foreground">{t('auth.resetSuccessDesc')}</p>
        </div>
        <Button asChild className="w-full">
          <a href="./login">{t('auth.backToLogin')}</a>
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex items-center gap-2.5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>Invalid reset link. The link may be broken or expired.</span>
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

      {/* Password */}
      <div className="space-y-3">
        <Label>{t('auth.newPassword')}</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('auth.passwordPlaceholder')}
            className="pl-10 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-0 flex h-full w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-3">
        <Label>{t('auth.confirmPassword')}</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder={t('auth.passwordPlaceholder')}
            className="pl-10"
          />
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('auth.resetting')}</span>
          </>
        ) : (
          <span>{t('auth.resetPasswordTitle')}</span>
        )}
      </Button>
    </form>
  );
}
