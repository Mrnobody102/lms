"use client";

import { useState } from "react";
import { Edit2, Trash2, ShieldAlert, RefreshCcw, Eye } from "lucide-react";
import { useTenantStore } from "../tenant.store";
import toast from "react-hot-toast";
import { TenantFormModal } from "./tenant-form-modal";
import { useRouter } from "../../../navigation";

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
        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        onClick={() => setIsEditModalOpen(true)}
        title="Cập nhật"
        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
      >
        <Edit2 className="w-4 h-4" />
      </button>

      {tenant.isActive ? (
        <button
          onClick={() => setIsDeleteModalOpen(true)}
          title="Ngưng hoạt động"
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleRestore}
          disabled={loading}
          title="Khôi phục"
          className="p-2 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-card border rounded-2xl shadow-2xl overflow-hidden p-8 text-center">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Xác nhận xóa?</h3>
            <p className="text-muted-foreground text-sm mb-6 font-medium">
              Bạn có chắc chắn muốn ngưng hoạt động trung tâm{" "}
              <strong className="text-foreground">{tenant.name}</strong> không?
              Học viên sẽ không thể đăng nhập cho đến khi được khôi phục.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 py-2 bg-destructive text-destructive-foreground hover:opacity-90 disabled:opacity-50 text-sm font-bold rounded-lg transition-all shadow-md active:scale-95"
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
