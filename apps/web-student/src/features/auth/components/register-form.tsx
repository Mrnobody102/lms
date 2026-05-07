'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../auth.store';
import { Loader2, AlertCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Label } from '@repo/ui';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations('Student');
  const { register, loading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!register) return;
    const success = await register(fullName, email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} data-hydrated={isHydrated} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-2.5">
        <Label>{t('auth.name')}</Label>
        <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 transition-all focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <User className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (error) clearError();
            }}
            placeholder="Nguyễn Văn A"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2.5">
        <Label>{t('auth.email')}</Label>
        <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 transition-all focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <Mail className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="email@example.com"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2.5">
        <Label>{t('auth.password')}</Label>
        <div className="flex h-12 items-center rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 transition-all focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
          <Lock className="ml-3.5 h-4 w-4 shrink-0 text-muted-foreground pointer-events-none" />
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder="Tối thiểu 8 ký tự"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
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
      </div>

      {/* Submit */}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('auth.registering')}</span>
          </>
        ) : (
          <span>{t('auth.registerButton')}</span>
        )}
      </Button>

      <p className="text-[11px] text-center text-muted-foreground leading-relaxed px-2">
        {t('auth.terms')}
      </p>
    </form>
  );
}
