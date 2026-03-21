"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Admin");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
      <Loader2 className="w-12 h-12 animate-spin text-primary" />
      <p className="font-black text-sm uppercase tracking-widest opacity-50">
        {t("Admin.loadEditor")}
      </p>
    </div>
  );
}
