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
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

interface TenantListProps {
  tenants: any[];
  loading: boolean;
}

export function TenantList({ tenants, loading }: TenantListProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const columnHelper = createColumnHelper<any>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Tên trung tâm",
        cell: (info) => (
          <span className="font-medium text-white">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.domain || `${row.slug}.lms.com`, {
        id: "domain",
        header: "Domain / Slug",
        cell: (info) => (
          <span className="text-slate-400 font-mono text-xs">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("isActive", {
        header: "Trạng thái",
        cell: (info) =>
          info.getValue() ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-400"></span>
              Hoạt động
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-500/10 text-red-400 border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-400"></span>
              Đã khoá
            </span>
          ),
      }),
      columnHelper.accessor("createdAt", {
        header: "Ngày tạo",
        cell: (info) => (
          <span className="text-slate-400">
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
    [],
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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
      <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900/50">
        <h3 className="font-semibold text-white">Danh sách Trung tâm</h3>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, slug..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-sm rounded-lg pl-9 pr-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 w-full sm:w-72 transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold tracking-wider">
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
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 border-t-transparent animate-spin"></div>
                    Đang tải dữ liệu...
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-slate-500"
                >
                  Không tìm thấy trung tâm nào.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/50 transition-colors"
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
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="text-sm text-slate-400">
            Hiển thị{" "}
            <span className="text-white font-medium">
              {table.getRowModel().rows.length}
            </span>{" "}
            /{" "}
            <span className="text-white font-medium">
              {table.getFilteredRowModel().rows.length}
            </span>{" "}
            trung tâm
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-500 text-sm px-2">
              Trang{" "}
              <span className="text-slate-200 font-medium">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              / {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
