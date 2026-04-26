'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../auth.store';
import { Loader2, AlertCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@repo/ui';

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations('Student');
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} data-hydrated={isHydrated} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-2">
        <Label>{t('auth.email')}</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="email@example.com"
            className="pl-10 pr-4"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>{t('auth.password')}</Label>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('auth.forgotPassword')}
          </button>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder="••••••••"
            className="pl-10 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted-foreground/10"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('auth.loggingIn')}</span>
          </>
        ) : (
          <span>{t('auth.loginButton')}</span>
        )}
      </Button>
    </form>
  );
}
