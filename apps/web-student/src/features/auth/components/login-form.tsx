"use client";

import { useState } from "react";
import { useAuthStore } from "../auth.store";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("Student");
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
          {t("auth.email")}
        </label>
        <div className="relative group">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="example@email.com"
            className="w-full bg-muted/50 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center ml-1">
          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("auth.password")}
          </label>
          <button
            type="button"
            className="text-xs font-bold text-primary hover:underline"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder="••••••••"
            className="w-full bg-muted/50 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          t("auth.loginButton")
        )}
      </button>
    </form>
  );
}
