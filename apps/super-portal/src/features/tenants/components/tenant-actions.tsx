"use client";

import { useState } from "react";
import { Edit2, Trash2, ShieldAlert, RefreshCcw, Eye } from "lucide-react";
import { useTenantStore } from "../tenant.store";
import toast from "react-hot-toast";
import { TenantFormModal } from "./tenant-form-modal";
import { useRouter } from "next/navigation";

export function TenantActions({ tenant }: { tenant: any }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const router = useRouter();
  const { deleteTenant, restoreTenant, fetchTenants, loading } =
    useTenantStore();

  const handleDelete = async () => {
    const success = await deleteTenant(tenant.id);
    if (success) {
      toast.success("Đã ngưng hoạt động trung tâm!");
      fetchTenants();
      setIsDeleteModalOpen(false);
    }
  };

  const handleRestore = async () => {
    const success = await restoreTenant(tenant.id);
    if (success) {
      toast.success("Đã khôi phục trung tâm!");
      fetchTenants();
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => router.push(`/tenants/${tenant.id}`)}
        title="Xem chi tiết"
        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        onClick={() => setIsEditModalOpen(true)}
        title="Cập nhật"
        className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-400/10 rounded-lg transition-colors"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {tenant.isActive ? (
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          title="Ngưng hoạt động"
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleRestore}
          disabled={loading}
          title="Khôi phục"
          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCcw className="w-4 h-4" />
        </button>
      )}

      {/* Edit Modal */}
      <TenantFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        tenant={tenant}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-slate-900 border border-red-900/50 rounded-2xl shadow-xl overflow-hidden p-6 text-center">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Xác nhận xóa?</h3>
            <p className="text-slate-400 text-sm mb-6">
              Bạn có chắc chắn muốn ngưng hoạt động trung tâm{" "}
              <strong>{tenant.name}</strong> không? Học viên sẽ không thể đăng
              nhập cho đến khi được khôi phục.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Hủy Phím
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-all"
              >
                {loading ? "Đang Xử Lý..." : "Ngưng Hoạt Động"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
