"use client";

import { LoginForm } from "@/features/auth/components/login-form";
import { ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminLoginPage() {
  const t = useTranslations("Admin");

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Radical Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-6 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white mb-2">
            ADMIN PORTAL
          </h1>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">
            Hệ quản trị đào tạo LMS
          </p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-2xl p-10 md:p-12 relative overflow-hidden group">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors duration-1000"></div>

          <LoginForm onSuccess={() => (window.location.href = "/")} />
        </div>

        <p className="mt-12 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-30">
          Authorized Personnel Only &copy; 2024 LMS Platform
        </p>
      </div>
    </div>
  );
}
