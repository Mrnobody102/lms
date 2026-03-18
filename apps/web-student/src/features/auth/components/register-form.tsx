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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3 text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
          {t("auth.name")}
        </label>
        <div className="relative group">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (error) clearError();
            }}
            placeholder="Nguyễn Văn A"
            className="w-full bg-muted/50 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
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
            className="w-full bg-muted/50 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
          {t("auth.password")}
        </label>
        <div className="relative group">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
            className="w-full bg-muted/50 border border-border/50 rounded-2xl pl-12 pr-6 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          t("auth.registerButton")
        )}
      </button>

      <p className="text-[10px] text-center text-muted-foreground font-bold leading-relaxed px-4 opacity-70">
        {t("auth.terms")}
      </p>
    </form>
  );
}
