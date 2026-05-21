'use client';

import { useState } from 'react';
import { useAuthStore } from '../auth.store';
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { GoogleSignInButton } from '@repo/ui';
import { Link } from '@/navigation';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const { login, loginWithGoogle, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const displayError = error ? t('auth.loginError') : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    const success = await loginWithGoogle(credential, 'admin');
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {displayError && (
        <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">{t('auth.email')}</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) clearError();
          }}
          placeholder={t('auth.emailPlaceholder')}
          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-foreground placeholder:text-zinc-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-primary dark:focus:ring-primary/20"
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">{t('auth.password')}</label>
        <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-zinc-50 text-foreground transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:focus-within:border-primary dark:focus-within:ring-primary/20">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder={t('auth.passwordPlaceholder')}
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="flex h-full w-12 shrink-0 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex justify-end pt-1">
          <Link
            href="/forgot-password"
            className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
          >
            {t('auth.forgotPassword')}
          </Link>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="mt-0 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-white transition-colors hover:opacity-90 disabled:bg-primary/50"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('auth.loggingIn')}</span>
          </>
        ) : (
          <span>{t('auth.loginButton')}</span>
        )}
      </button>

      <div className="space-y-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          {t('auth.orContinueWith')}
          <span className="h-px flex-1 bg-border" />
        </div>
        <GoogleSignInButton
          clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          locale={locale}
          label={t('auth.googleLogin')}
          loadingLabel={t('auth.loggingIn')}
          disabledLabel={t('auth.googleNotConfigured')}
          disabled={loading}
          onCredential={handleGoogleCredential}
        />
      </div>
    </form>
  );
}
