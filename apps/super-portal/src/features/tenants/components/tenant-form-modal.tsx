"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTenantStore } from "@/features/tenants/tenant.store";

export function TenantFormModal({
  isOpen,
  onClose,
  tenant,
}: {
  isOpen: boolean;
  onClose: () => void;
  tenant?: any | null;
}) {
  const { createTenant, updateTenant, fetchTenants, loading } =
    useTenantStore();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) {
      toast.error("Tên trung tâm và slug là bắt buộc");
      return;
    }

    const payload = {
      ...formData,
      domain: formData.domain || undefined,
    };

    let success;
    if (tenant) {
      success = await updateTenant(tenant.id, payload);
    } else {
      success = await createTenant(payload);
    }

    if (success) {
      toast.success(
        tenant ? "Cập nhật trung tâm thành công!" : "Tạo trung tâm thành công!",
      );
      fetchTenants(); // Refresh data
      onClose();
      if (!tenant) setFormData({ name: "", slug: "", domain: "" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">
            {tenant ? "Chỉnh Sửa Trung Tâm" : "Thêm Trung Tâm Mới"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tên Trung Tâm *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Ví dụ: Trung tâm Tiếng Trung ABC"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Slug (Đường dẫn) *
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="vi-du: abc-center"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
            />
            <p className="text-xs text-slate-500 mt-1">
              Dùng cho URL: abc-center.lms.com
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tên miền riêng (Tùy chọn)
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
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
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-all"
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
