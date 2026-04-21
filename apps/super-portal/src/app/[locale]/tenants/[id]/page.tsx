'use client';

import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { useTenant } from '@/hooks/use-tenants';
import { ArrowLeft, Building2, Globe, Settings, Activity } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useAuthStore } from '@/features/auth/auth.store';
import { LoginModal } from '@/features/auth/components/login-modal';
import { use, useEffect } from 'react';

export default function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: currentTenant, isLoading: tenantLoading } = useTenant(id);
  const { isAuthenticated, checkAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
        <p className="text-muted-foreground font-medium">Loading Super Portal...</p>
      </div>
    );
  }

  if (tenantLoading) {
    return (
      <div className="min-h-screen flex flex-col text-foreground">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <Activity className="w-10 h-10 text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground font-medium">Đang tải thông tin chi tiết...</p>
        </div>
        <Footer />
        {!isAuthenticated && <LoginModal />}
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="min-h-screen flex flex-col text-foreground">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground font-medium">Không tìm thấy trung tâm</p>
          <Link href="/" className="mt-4 text-primary underline">
            Quay lại danh sách
          </Link>
        </div>
        <Footer />
        {!isAuthenticated && <LoginModal />}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans">
      <Header />
      <div className="p-8 max-w-7xl mx-auto text-foreground">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </Link>
        </div>

        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-primary" />
              {currentTenant.name}
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
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
          <div className="col-span-1 bg-card border rounded-2xl p-6 h-fit shadow-sm">
            <h3 className="text-lg font-bold mb-4 border-b pb-2">Thông tin chung</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Tên trung tâm</p>
                <p className="font-semibold">{currentTenant.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Mã hệ thống (Slug)</p>
                <p className="font-mono text-xs bg-muted p-1 rounded inline-block">
                  {currentTenant.slug}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Tên miền tùy chỉnh</p>
                <p className="font-semibold">{currentTenant.domain || 'Chưa thiết lập'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 font-medium">Ngày tạo</p>
                <p className="font-semibold">
                  {format(new Date(currentTenant.createdAt), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Settings / Configs Placeholder */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b pb-2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" /> Cấu hình & Cài đặt
                </h3>
              </div>
              <div className="bg-muted/30 rounded-lg p-10 border border-dashed text-center">
                <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h4 className="text-lg font-bold mb-2">
                  Các tính năng cấu hình đang được phát triển
                </h4>
                <p className="text-muted-foreground max-w-md mx-auto font-medium">
                  Tại đây sẽ bao gồm các tính năng mở rộng sau này như: Cài đặt giao diện, cấu hình
                  thanh toán, phân quyền người dùng, giới hạn tài nguyên và nhiều mục chi tiết khác
                  cho từng trung tâm.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!isAuthenticated && <LoginModal />}
      <Footer />
    </div>
  );
}
