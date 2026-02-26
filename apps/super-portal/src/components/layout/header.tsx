"use client";

import Image from "next/image";
import { useAuthStore } from "@/features/auth/auth.store";

export function Header() {
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20">
          S
        </div>
        <span className="font-bold text-lg tracking-wide text-white">
          Super Portal
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
          V1.0
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          Documentation
        </button>
        {isAuthenticated && (
          <button
            onClick={logout}
            className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors mr-2"
          >
            Logout
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden relative">
          <Image
            src="https://ui-avatars.com/api/?name=Admin&background=blue&color=fff"
            alt="Admin Avatar"
            fill
            sizes="32px"
            unoptimized
          />
        </div>
      </div>
    </header>
  );
}
