"use client";

import Image from "next/image";
import { useAuthStore } from "@/features/auth/auth.store";
import { ThemeToggle } from "@repo/ui";

export function Header() {
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="h-16 border-b bg-card/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/20">
          S
        </div>
        <span className="font-bold text-lg tracking-wide">Super Portal</span>
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border">
          V1.0
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          Documentation
        </button>
        <ThemeToggle />
        {isAuthenticated && (
          <button
            onClick={logout}
            className="text-sm font-medium text-destructive hover:opacity-80 transition-colors mr-2"
          >
            Logout
          </button>
        )}
        <div className="w-8 h-8 rounded-full bg-muted border overflow-hidden relative">
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
