"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format } from "date-fns";
import { TenantActions } from "./tenant-actions";
import { Tenant } from "@/hooks/use-tenants";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface TenantListProps {
  tenants: Tenant[];
  loading: boolean;
}

export function TenantList({ tenants, loading }: TenantListProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columnHelper = createColumnHelper<Tenant>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Tên trung tâm",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.domain || `${row.slug}.lms.com`, {
        id: "domain",
        header: "Domain / Slug",
        cell: (info) => (
          <span className="text-muted-foreground font-mono text-xs">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("isActive", {
        header: "Trạng thái",
        cell: (info) =>
          info.getValue() ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-success"></span>
              Hoạt động
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-destructive"></span>
              Đã khóa
            </span>
          ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Ngày tạo",
        cell: (info) => (
          <span className="text-muted-foreground">
            {format(new Date(info.getValue()), "dd/MM/yyyy")}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Thao tác</div>,
        cell: (info) => (
          <div className="flex justify-end">
            <TenantActions tenant={info.row.original} />
          </div>
        ),
      }),
    ],
    [columnHelper],
  );

  const table = useReactTable({
    data: tenants,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const search = String(filterValue).toLowerCase();
      const value = row.getValue(columnId);
      if (columnId === "name" || columnId === "domain") {
        return value ? String(value).toLowerCase().includes(search) : false;
      }
      return false;
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="bg-card border rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card/50">
        <h3 className="font-semibold">Danh sách Trung tâm</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, slug..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="bg-background border text-sm rounded-lg pl-9 pr-4 py-2 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-72 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-6 py-4 whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  Không tìm thấy trung tâm nào.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-between bg-card/50">
          <div className="text-sm text-muted-foreground">
            Hiển thị{" "}
            <span className="text-foreground font-medium">
              {table.getRowModel().rows.length}
            </span>{" "}
            /{" "}
            <span className="text-foreground font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            trung tâm
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-muted-foreground text-sm px-2">
              Trang{" "}
              <span className="text-foreground font-medium">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              / {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
