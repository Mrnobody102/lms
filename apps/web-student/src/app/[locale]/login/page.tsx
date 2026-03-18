"use client";

import { LoginForm } from "../../../features/auth/components/login-form";
import { Link } from "../../../navigation";
import { Trophy, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function LoginPage() {
  const t = useTranslations("Student");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-orange-500/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-10 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {t("nav.home") || "Quay lại trang chủ"}
        </Link>

        {/* Card */}
        <div className="bg-card/40 backdrop-blur-2xl border border-border/50 rounded-[2.5rem] shadow-2xl p-10 md:p-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 shadow-inner">
              <Trophy className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter mb-3">
              {t("auth.loginTitle")}
            </h1>
            <p className="text-sm font-bold text-muted-foreground/60 max-w-[280px] mx-auto">
              {t("auth.loginDesc")}
            </p>
          </div>

          <LoginForm />

          <div className="mt-10 text-center border-t border-border/20 pt-8">
            <p className="text-xs font-bold text-muted-foreground/50">
              {t("auth.footerLogin")}
              <Link
                href="/register"
                className="ml-2 text-primary hover:text-primary/80 font-black transition-colors border-b-2 border-primary/20 hover:border-primary pb-0.5"
              >
                {t("auth.signUpLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
