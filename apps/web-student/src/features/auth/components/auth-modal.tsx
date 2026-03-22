'use client';

import { useState, useEffect } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '../auth.store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login' }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const t = useTranslations('Student');
  const { isAuthenticated } = useAuthStore();

  // Safety net: close modal if user becomes authenticated (e.g., after login)
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      onClose();
    }
  }, [isAuthenticated, isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-card/60 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95 fade-in duration-500">
        {/* Decorative Background Elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-8 top-8 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all z-10 hover:rotate-90 active:scale-90"
        >
          <X className="w-5 h-5 text-foreground/50" />
        </button>

        <div className="p-10 md:p-14 relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/20 to-primary/5 text-primary mb-8 shadow-2xl relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-[2rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {tab === 'login' ? (
                <Trophy className="w-10 h-10 relative z-10" />
              ) : (
                <Sparkles className="w-10 h-10 relative z-10" />
              )}
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-3 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
              {tab === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </h2>
            <p className="text-sm font-bold text-muted-foreground/60 max-w-[280px] mx-auto leading-relaxed">
              {tab === 'login' ? t('auth.loginDesc') : t('auth.registerDesc')}
            </p>
          </div>

          {/* Premium Tab Switcher */}
          <div className="flex p-2 bg-muted/30 backdrop-blur-md rounded-[1.5rem] mb-10 border border-border/50 shadow-inner relative">
            <div
              className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-primary rounded-[1rem] shadow-lg shadow-primary/30 transition-all duration-500 ease-out ${
                tab === 'login' ? 'left-2' : 'left-[calc(50%+4px)]'
              }`}
            />
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1rem] transition-all duration-300 relative z-10 ${
                tab === 'login'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.loginTab')}
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-3.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-[1rem] transition-all duration-300 relative z-10 ${
                tab === 'register'
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('auth.registerTab')}
            </button>
          </div>

          {/* Form Area with consistent height to prevent jumps */}
          <div className="min-h-[380px] transition-all duration-500">
            {tab === 'login' ? (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <LoginForm onSuccess={onClose} />
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <RegisterForm onSuccess={onClose} />
              </div>
            )}
          </div>

          {/* Footer Toggle */}
          <div className="mt-12 text-center border-t border-border/20 pt-8">
            <p className="text-xs font-bold text-muted-foreground/50">
              {tab === 'login' ? t('auth.footerLogin') : t('auth.footerRegister')}
              <button
                onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
                className="ml-2 text-primary hover:text-primary/80 font-black transition-colors border-b-2 border-primary/20 hover:border-primary pb-0.5"
              >
                {tab === 'login' ? t('auth.signUpLink') : t('auth.signInLink')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
