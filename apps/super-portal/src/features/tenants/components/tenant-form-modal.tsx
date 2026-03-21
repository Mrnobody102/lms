"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateTenant, useUpdateTenant, Tenant } from "@/hooks/use-tenants";

export function TenantFormModal({
  isOpen,
  onClose,
  tenant,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenant?: Tenant | null;
}) {
  const createTenant = useCreateTenant();
  const updateTenant = useUpdateTenant();
  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    slug: tenant?.slug || "",
    domain: tenant?.domain || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: tenant?.name || "",
        slug: tenant?.slug || "",
        domain: tenant?.domain || "",
      });
    }
  }, [isOpen, tenant]);

  if (!isOpen) return null;

  const loading = createTenant.isPending || updateTenant.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error("Tên trung tâm và slug là bắt buộc");
      return;
    }

    const payload = {
      ...formData,
      domain: formData.domain || undefined,
    };

    if (tenant) {
      updateTenant.mutate(
        { id: tenant.id, data: payload },
        {
          onSuccess: () => {
            toast.success("Cập nhật trung tâm thành công!");
            onClose();
          },
          onError: () => {
            toast.error("Không thể cập nhật trung tâm");
          },
        },
      );
    } else {
      createTenant.mutate(payload, {
        onSuccess: () => {
          toast.success("Tạo trung tâm thành công!");
          onClose();
          setFormData({ name: "", slug: "", domain: "" });
        },
        onError: () => {
          toast.error("Không thể tạo trung tâm");
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-card border rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">
            {tenant ? "Chỉnh Sửa Trung Tâm" : "Thêm Trung Tâm Mới"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1">
              Tên Trung Tâm *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="Ví dụ: Trung tâm Tiếng Trung ABC"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              Slug (Đường dẫn) *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="vi-du: abc-center"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              Dùng cho URL: abc-center.lms.com
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              Tên miền riêng (Tùy chọn)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-background border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="ví dụ: abc-center.vn"
              value={formData.domain}
              onChange={(e) =>
                setFormData({ ...formData, domain: e.target.value })
              }
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-sm font-bold rounded-lg flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <PlusCircle className="w-4 h-4" />
              )}
              {tenant ? "Lưu Thay Đổi" : "Khởi Tạo Ngay"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
