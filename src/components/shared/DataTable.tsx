"use client";

import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

// ======================== انواع ========================
interface Column<T> {
  key: string;            // کلید برای sort و دسترسی به داده
  title: string;          // عنوان ستون
  sortable?: boolean;     // آیا قابل مرتب‌سازی است؟
  render?: (item: T) => React.ReactNode; // سفارشی‌سازی نمایش سلول
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;       // تعداد کل رکوردها (برای صفحه‌بندی)
  pageSize: number;          // تعداد رکورد در هر صفحه
  currentPage: number;       // صفحه جاری
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSort?: (key: string, order: "asc" | "desc") => void;
  sortKey?: string;
  sortOrder?: "asc" | "desc";
  isLoading?: boolean;
  pageSizeOptions?: number[]; // مقادیر پیشنهادی: [10, 20, 50, 100]
  actions?: (item: T) => React.ReactNode; // دکمه‌های عملیات هر سطر
  toolbarActions?: React.ReactNode; // دکمه‌های بالای جدول (create, export, ...)
}

// مقادیر پیش‌فرض برای تعداد رکورد در هر صفحه
const defaultPageSizeOptions = [10, 20, 50, 100];

// ======================== کامپوننت ========================
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  onSort,
  sortKey,
  sortOrder,
  isLoading = false,
  pageSizeOptions = defaultPageSizeOptions,
  actions,
  toolbarActions,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSort = (key: string) => {
    if (!onSort) return;
    if (sortKey === key) {
      onSort(key, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(key, "asc");
    }
  };

  const getSortIcon = (key: string) => {
    if (!sortKey || sortKey !== key)
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortOrder === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  // تولید شماره صفحات با بیضی برای تعداد زیاد
  const getPageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  return (
    <div className="border border-border rounded-none bg-card">
      {/* نوار ابزار (دکمه‌های بالای جدول) */}
      {toolbarActions && (
        <div className="flex items-center justify-end px-4 py-3 border-b border-border gap-2">
          {toolbarActions}
        </div>
      )}

      {/* جدول */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={`text-center ${col.sortable ? "cursor-pointer select-none" : ""}`}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div className="flex items-center justify-center gap-1">
                  {col.title}
                  {col.sortable && getSortIcon(col.key)}
                </div>
              </TableHead>
            ))}
            {actions && <TableHead className="text-center">عملیات</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                در حال بارگذاری...
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-8">
                داده‌ای یافت نشد
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, idx) => (
              <TableRow key={idx}>
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-center">
                    {col.render ? col.render(row) : row[col.key] ?? null}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="text-center">{actions(row)}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* پایین جدول: pagination و انتخاب تعداد رکورد */}
      <div className="flex items-center justify-end px-4 py-3 border-t border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-sm text-muted-foreground">تعداد در صفحه:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => onPageSizeChange(Number(val))}
            >
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" sideOffset={4}>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size.toLocaleString("fa-IR")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* صفحه‌بندی */}
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </PaginationItem>

                {getPageNumbers.map((item, idx) => {
                  if (item === "ellipsis") {
                    return (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={currentPage === item}
                        onClick={() => onPageChange(item)}
                      >
                        {item.toLocaleString("fa-IR")}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </div>
  );
}