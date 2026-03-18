"use client";

import { useState, useEffect } from "react";
import { X, Trophy, Sparkles } from "lucide-react";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { useTranslations } from "next-intl";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({
  isOpen,
  onClose,
  defaultTab = "login",
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const t = useTranslations("Student");

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
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

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 rounded-xl bg-muted/50 hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary/10 text-primary mb-6 shadow-inner">
              {tab === "login" ? (
                <Trophy className="w-8 h-8" />
              ) : (
                <Sparkles className="w-8 h-8" />
              )}
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-2 italic">
              {tab === "login" ? t("auth.loginTitle") : t("auth.registerTitle")}
            </h2>
            <p className="text-sm font-bold text-muted-foreground opacity-60">
              {tab === "login" ? t("auth.loginDesc") : t("auth.registerDesc")}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex p-1.5 bg-muted/50 rounded-2xl mb-8 border border-border/20">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                tab === "login"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t("auth.loginTab")}
            </button>
            <button
              onClick={() => setTab("register")}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${
                tab === "register"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t("auth.registerTab")}
            </button>
          </div>

          {/* Form */}
          <div className="min-h-[300px]">
            {tab === "login" ? (
              <LoginForm onSuccess={onClose} />
            ) : (
              <RegisterForm onSuccess={onClose} />
            )}
          </div>

          {/* Footer Toggle */}
          <div className="mt-8 text-center">
            <p className="text-xs font-bold text-muted-foreground italic">
              {tab === "login"
                ? t("auth.footerLogin")
                : t("auth.footerRegister")}
              <button
                onClick={() => setTab(tab === "login" ? "register" : "login")}
                className="ml-2 text-primary hover:underline font-black not-italic"
              >
                {tab === "login" ? t("auth.signUpLink") : t("auth.signInLink")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
