"use client";

import { useEffect, useState } from "react";
import { Server, PlusCircle, Calendar } from "lucide-react";
import { useTenantStore } from "@/features/tenants/tenant.store";
import { TenantStats } from "@/features/tenants/components/tenant-stats";
import { TenantFormModal } from "@/features/tenants/components/tenant-form-modal";
import { TenantList } from "@/features/tenants/components/tenant-list";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useAuthStore } from "@/features/auth/auth.store";
import { LoginModal } from "@/features/auth/components/login-modal";
import { format } from "date-fns";

export default function SuperAdminHome() {
  const { tenants, loading, fetchTenants } = useTenantStore();
  const { isAuthenticated, checkAuth, isInitialized } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTenants();
    }
  }, [isAuthenticated, fetchTenants]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Server className="w-10 h-10 text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-400">Loading Super Portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      {/* Topbar */}
      <Header />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Systems & Tenants
            </h1>
            <p className="text-slate-500 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Monitoring status of {format(new Date(), "MMMM d, yyyy")}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Tenant
          </button>
        </div>

        {/* Global Stats */}
        <TenantStats totalActiveTenants={tenants.length} />

        {/* Tenant List Component */}
        <TenantList tenants={tenants} loading={loading} />
      </div>

      <TenantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <LoginModal isOpen={!isAuthenticated} />

      <Footer />
    </div>
  );
}
