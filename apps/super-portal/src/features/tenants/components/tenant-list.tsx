'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Tenant } from '@/hooks/use-tenants';
import { TenantActions } from './tenant-actions';

interface TenantListProps {
  tenants: Tenant[];
  loading: boolean;
}

const columnHelper = createColumnHelper<Tenant>();

export function TenantList({ tenants, loading }: TenantListProps) {
  const t = useTranslations('SuperPortal.tenants');
  const locale = useLocale();
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: t('name'),
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.domain || `${row.slug}.lms.com`, {
        id: 'domain',
        header: t('domain'),
        cell: (info) => (
          <span className="font-mono text-xs text-muted-foreground">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('isActive', {
        header: t('status'),
        cell: (info) =>
          info.getValue() ? (
            <span className="inline-flex items-center rounded-full border border-success/20 bg-success/10 px-2.5 py-0.5 text-xs font-bold text-success">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-success" />
              {t('active')}
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-0.5 text-xs font-bold text-destructive">
              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
              {t('inactive')}
            </span>
          ),
      }),
      columnHelper.accessor('createdAt', {
        header: t('createdAt'),
        cell: (info) => (
          <span className="text-muted-foreground">{formatDate(info.getValue(), locale)}</span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className="text-right">{t('actions')}</div>,
        cell: (info) => (
          <div className="flex justify-end">
            <TenantActions tenant={info.row.original} />
          </div>
        ),
      }),
    ],
    [locale, t],
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
      if (columnId === 'name' || columnId === 'domain') {
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
    <div className="flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col items-start justify-between gap-4 border-b bg-card/50 p-6 sm:flex-row sm:items-center">
        <h3 className="font-semibold">{t('list')}</h3>
        <div className="flex h-10 items-center rounded-lg border border-input bg-background text-foreground transition-colors focus-within:ring-2 focus-within:ring-primary/20">
          <Search className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-full w-full min-w-0 flex-1 border-0 bg-transparent px-3 py-0 text-sm text-foreground outline-none placeholder:text-muted-foreground/50 focus:ring-0 sm:w-72"
          />
        </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-6 py-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    {t('loading')}
                  </div>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-10 text-center text-muted-foreground"
                >
                  {t('empty')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="transition-colors hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between border-t bg-card/50 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {t('showingCount', {
              visible: table.getRowModel().rows.length,
              total: table.getFilteredRowModel().rows.length,
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label={t('firstPage')}
              title={t('firstPage')}
            >
              <ChevronsLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label={t('previousPage')}
              title={t('previousPage')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="px-2 text-sm text-muted-foreground">
              {t('pageValue', {
                page: table.getState().pagination.pageIndex + 1,
                total: table.getPageCount(),
              })}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label={t('nextPage')}
              title={t('nextPage')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:hover:bg-transparent"
              aria-label={t('lastPage')}
              title={t('lastPage')}
            >
              <ChevronsRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
  }).format(new Date(value));
}
