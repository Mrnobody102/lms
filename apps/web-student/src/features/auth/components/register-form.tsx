'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../auth.store';
import { Loader2, AlertCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button, Input, Label } from '@repo/ui';

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations('Student');
  const { register, loading, error, clearError } = useAuthStore();
  const displayError = error ? t('auth.registerError') : null;
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
      {displayError && (
        <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive font-medium text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-2">
        <Label className="block">{t('auth.name')}</Label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (error) clearError();
            }}
            placeholder={t('auth.namePlaceholder')}
            className="pl-10"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label className="block">{t('auth.email')}</Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder={t('auth.emailPlaceholder')}
            className="pl-10"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label className="block">{t('auth.password')}</Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder={t('auth.passwordPlaceholder')}
            className="pl-10 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-0 top-0 flex h-full w-12 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
