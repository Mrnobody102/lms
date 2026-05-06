'use client';

import { useState } from 'react';
import { useAuthStore } from '../auth.store';
import toast from 'react-hot-toast';
import { Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

import { useTranslations } from 'next-intl';

export function LoginModal() {
  const t = useTranslations('Auth');
  const { login, loading } = useAuthStore();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-card border rounded-3xl shadow-2xl overflow-hidden p-8">
        <div className="mb-8 text-center text-foreground">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/30 mx-auto mb-4">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold mb-1">{t('portalTitle')}</h2>
          <p className="text-sm text-muted-foreground font-medium">{t('desc')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">{t('email')}</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-background border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground mb-1">{t('password')}</label>
            <div className="flex h-12 items-center rounded-xl border bg-background text-foreground transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                className="h-full min-w-0 flex-1 bg-transparent px-4 text-sm font-medium outline-none placeholder:text-muted-foreground"
                placeholder="********"
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
            className="w-full py-4 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-primary/20 active:scale-95"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('login')}
          </button>
        </form>
      </div>
    </div>
  );
}
