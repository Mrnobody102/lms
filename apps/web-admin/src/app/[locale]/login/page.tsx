"use client";

import { LoginForm } from "@/features/auth/components/login-form";

export default function AdminLoginPage() {

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-600/25">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Admin Portal
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Hệ quản trị đào tạo
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <LoginForm onSuccess={() => (window.location.href = "/")} />
        </div>

        <p className="text-center text-[11px] text-zinc-600 mt-8">
          © 2024 LMS Platform
        </p>
      </div>
    </div>
  );
}
