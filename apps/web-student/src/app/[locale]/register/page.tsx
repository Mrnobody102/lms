"use client";

import { RegisterForm } from "../../../features/auth/components/register-form";
import { Link } from "../../../navigation";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("Student");

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-6 shadow-lg shadow-primary/25">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t("auth.registerTitle")}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t("auth.registerDesc")}
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <RegisterForm />
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          {t("auth.footerRegister")}{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            {t("auth.signInLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
