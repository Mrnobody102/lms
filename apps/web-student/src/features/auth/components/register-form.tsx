'use client';

import { useState } from 'react';
import { useAuthStore } from '../auth.store';
import { Loader2, AlertCircle, Eye, EyeOff, User, Mail, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!register) return;
    const success = await register(fullName, email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="flex items-center gap-2.5 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-400">{t('auth.name')}</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (error) clearError();
            }}
            placeholder="Nguyễn Văn A"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-400">{t('auth.email')}</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
            <Mail className="w-4 h-4" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="email@example.com"
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-400">{t('auth.password')}</label>
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
            <Lock className="w-4 h-4" />
          </div>
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
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-12 py-3 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-primary/70 focus:ring-2 focus:ring-primary/20 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors w-9 h-9 flex items-center justify-center rounded-lg hover:bg-zinc-700/50"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{t('auth.registering')}</span>
          </>
        ) : (
          <span>{t('auth.registerButton')}</span>
        )}
      </button>

      <p className="text-[11px] text-center text-zinc-600 leading-relaxed px-2">
        {t('auth.terms')}
      </p>
    </form>
  );
}
