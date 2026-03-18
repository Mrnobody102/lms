"use client";

import { useState } from "react";
import { useAuthStore } from "../auth.store";
import { Loader2, Mail, Lock, User, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const t = useTranslations("Student");
  const { register, loading, error, clearError } = useAuthStore();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await register(fullName, email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 ml-1">
          {t("auth.name")}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
            <User className="w-full h-full" />
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
            className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-background focus:border-primary/30 transition-all duration-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 ml-1">
          {t("auth.email")}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
            <Mail className="w-full h-full" />
          </div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) clearError();
            }}
            placeholder="example@email.com"
            className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-background focus:border-primary/30 transition-all duration-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/70 ml-1">
          {t("auth.password")}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-muted-foreground group-focus-within:text-primary transition-colors duration-300">
            <Lock className="w-full h-full" />
          </div>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder="••••••••"
            className="w-full bg-muted/30 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-bold text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-background focus:border-primary/30 transition-all duration-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 mt-4 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span className="relative z-10">{t("auth.registerButton")}</span>
          </>
        )}
      </button>

      <p className="text-[10px] text-center text-muted-foreground font-bold leading-relaxed px-4 opacity-70 italic">
        {t("auth.terms")}
      </p>
    </form>
  );
}
