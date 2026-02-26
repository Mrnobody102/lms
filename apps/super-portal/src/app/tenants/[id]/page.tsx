"use client";

import { useEffect, use } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { useTenantStore } from "@/features/tenants/tenant.store";
import { ArrowLeft, Building2, Globe, Settings, Activity } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useAuthStore } from "@/features/auth/auth.store";
import { LoginModal } from "@/features/auth/components/login-modal";

export default function TenantDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { currentTenant, loading, fetchTenantById } = useTenantStore();
  const { isAuthenticated, checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchTenantById(id);
    }
  }, [isAuthenticated, id, fetchTenantById]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-blue-500 animate-pulse mb-4" />
        <p className="text-slate-400">Loading Super Portal...</p>
      </div>
    );
  }

  if (loading || !currentTenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Activity className="w-10 h-10 text-blue-500 animate-pulse mb-4" />
          <p className="text-slate-400">Đang tải thông tin chi tiết...</p>
        </div>
        <Footer />
        <LoginModal isOpen={!isAuthenticated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200">
      <Header />
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-500" />
              {currentTenant.name}
            </h1>
            <p className="text-slate-500 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              {currentTenant.domain || `${currentTenant.slug}.lms.com`}
            </p>
          </div>
          <div>
            {currentTenant.isActive ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                <span className="w-2 h-2 rounded-full mr-2 bg-emerald-400"></span>
                Đang hoạt động
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                <span className="w-2 h-2 rounded-full mr-2 bg-red-400"></span>
                Đã khóa
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Info Card */}
          <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
            <h3 className="text-lg font-semibold text-white mb-4 border-b border-slate-800 pb-2">
              Thông tin chung
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Tên trung tâm</p>
                <p className="text-slate-200 font-medium">
                  {currentTenant.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">
                  Mã hệ thống (Slug)
                </p>
                <p className="text-slate-200 font-mono text-sm">
                  {currentTenant.slug}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">
                  Tên miền tùy chỉnh
                </p>
                <p className="text-slate-200">
                  {currentTenant.domain || "Chưa thiết lập"}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Ngày tạo</p>
                <p className="text-slate-200">
                  {format(
                    new Date(currentTenant.createdAt),
                    "dd/MM/yyyy HH:mm",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Settings / Configs Placeholder */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-400" /> Cấu hình & Cài
                  đặt
                </h3>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-10 border border-slate-800/50 text-center">
                <Settings className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-slate-300 mb-2">
                  Các tính năng cấu hình đang được phát triển
                </h4>
                <p className="text-slate-500 max-w-md mx-auto">
                  Tại đây sẽ bao gồm các tính năng mở rộng sau này như: Cài đặt
                  giao diện, cấu hình thanh toán, phân quyền người dùng, giới
                  hạn tài nguyên và nhiều mục chi tiết khác cho từng trung tâm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LoginModal isOpen={!isAuthenticated} />
      <Footer />
    </div>
  );
}
