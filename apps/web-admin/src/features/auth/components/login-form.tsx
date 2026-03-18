"use client";

import { useState } from "react";
import { useAuthStore } from "../auth.store";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface LoginFormProps {
  onSuccess?: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const t = useTranslations("Admin");
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="space-y-2.5">
        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500 ml-1">
          {t("auth.email")}
        </label>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-300">
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
            placeholder="admin@lms.com"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-black focus:border-blue-500/30 transition-all duration-300"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex justify-between items-center ml-1">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-500">
            {t("auth.password")}
          </label>
          <button
            type="button"
            className="text-[10px] font-black uppercase tracking-widest text-blue-500 hover:opacity-70 transition-opacity"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-zinc-500 group-focus-within:text-blue-500 transition-colors duration-300">
            <Lock className="w-full h-full" />
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) clearError();
            }}
            placeholder="••••••••"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-6 py-4 font-bold text-white placeholder:text-zinc-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-black focus:border-blue-500/30 transition-all duration-300"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-2xl shadow-blue-900/20 hover:shadow-blue-900/40 hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0 transition-all duration-300 flex items-center justify-center gap-3 mt-4 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <span className="relative z-10">{t("auth.loginButton")}</span>
        )}
      </button>
    </form>
  );
}
