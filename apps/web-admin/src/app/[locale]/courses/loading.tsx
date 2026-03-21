"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("Admin");

  return (
    <div className="min-h-screen font-sans flex transition-colors duration-300 bg-background/50">
      <div className="md:ml-64 flex-1 p-6 md:p-10 lg:p-16">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="font-black text-sm uppercase tracking-widest opacity-50">
            {t("Admin.loading")}
          </p>
        </div>
      </div>
    </div>
  );
}
