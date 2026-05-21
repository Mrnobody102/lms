'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Input, Label } from '@repo/ui';
import { defaultApiClient } from '@repo/api-client';
import { useAuthStore } from '../../auth/auth.store';
import { useRouter } from 'next/navigation';

export function ChangePasswordForm() {
  const t = useTranslations('Student');
  const router = useRouter();
  const { logout } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await defaultApiClient.put('/users/change-password', {
        currentPassword,
        newPassword,
      });

      setSuccess(true);

      // Auto logout after 2 seconds because changing password revokes all tokens
      setTimeout(async () => {
        await logout();
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string | string[] } } };
      const msg = axiosErr.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
          {t('settings.security.changeSuccess')}
        </div>
      )}

      <div className="space-y-4 max-w-md">
        {/* Current Password */}
        <div className="space-y-2">
          <Label>{t('settings.security.currentPassword')}</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="h-12 py-0"
              style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
            />
          </div>
        </div>

        <div className="h-px bg-muted" />

        {/* New Password */}
        <div className="space-y-2">
          <Label>{t('settings.security.newPassword')}</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-12 py-0"
              style={{ paddingLeft: '2.75rem', paddingRight: '3rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">{t('settings.security.passwordHelp')}</p>
        </div>

        {/* Confirm New Password */}
        <div className="space-y-2">
          <Label>{t('settings.security.confirmPassword')}</Label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-muted-foreground">
              <Lock className="h-4 w-4" />
            </div>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="h-12 py-0"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading} variant="destructive" className="min-w-[140px]">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              {t('settings.security.changing')}
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 mr-2" />
              {t('settings.security.changePassword')}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
