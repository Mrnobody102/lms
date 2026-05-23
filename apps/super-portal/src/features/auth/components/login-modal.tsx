'use client';

import { useState } from 'react';
import { useAuthStore } from '../auth.store';
import toast from 'react-hot-toast';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { GoogleSignInButton, LanguageToggle } from '@repo/ui';

import { useLocale, useTranslations } from 'next-intl';

export function LoginModal() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const { login, loginWithGoogle, loading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      toast.success(t('welcome'));
    } else {
      toast.error(t('loginError'));
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    const success = await loginWithGoogle(credential, 'super');
    if (success) {
      toast.success(t('welcome'));
    } else {
      toast.error(t('loginError'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border bg-card p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex justify-end">
          <LanguageToggle />
        </div>

        <div className="mb-6 text-center text-foreground sm:mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <KeyRound className="h-6 w-6" />
          </div>
          <h2 className="mb-1 text-2xl font-extrabold">{t('portalTitle')}</h2>
          <p className="text-sm text-muted-foreground font-medium">{t('desc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-bold text-foreground">{t('email')}</label>
            <input
              type="email"
              required
              className="w-full rounded-xl border bg-background px-4 py-3 font-medium text-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold text-foreground">{t('password')}</label>
            <div className="flex h-12 items-center rounded-xl border bg-background text-foreground transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-medium outline-none placeholder:text-muted-foreground"
                placeholder={t('passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex h-full w-12 shrink-0 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                aria-label={showPassword ? t('hidePassword') : t('showPassword')}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login')}
          </button>

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t('orContinueWith')}
              <span className="h-px flex-1 bg-border" />
            </div>
            <GoogleSignInButton
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
              locale={locale}
              label={t('googleLogin')}
              loadingLabel={t('submitting')}
              disabledLabel={t('googleNotConfigured')}
              disabled={loading}
              onCredential={handleGoogleCredential}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
