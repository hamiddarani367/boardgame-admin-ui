"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toPersianDigits, formatNumberToPersian } from "@/lib/format";

// تبدیل داده‌ها به CSV
const exportToCSV = (returns: any[]) => {
  if (!returns.length) return;
  const headers = ["شناسه مرجوعی", "شماره سفارش", "کاربر", "علت", "مبلغ", "وضعیت", "تاریخ ثبت"];
  const rows = returns.map((r) => [
    r.id,
    r.order_id,
    r.user_name,
    r.reason,
    r.amount,
    r.status,
    r.created_at,
  ]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "returns.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ReturnsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const initialFilters: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    initialFilters[key] = value;
  });

  const [sort, setSort] = useState({ key: initialSortBy, order: initialSortOrder });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(initialFilters);

  const { data, isLoading } = useApiQuery<{ returns: any[]; total: number }>(
    "/orders/returns",
    ["returns"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  // همگام‌سازی URL
  const updateURL = useCallback(
    (
      p: number,
      l: number,
      s: { key: string; order: "asc" | "desc" },
      f: Record<string, any>
    ) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "desc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
      router.replace(
        `/orders/returns${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false }
      );
    },
    [router]
  );

  useEffect(() => {
    updateURL(page, limit, sort, filters);
  }, [page, limit, sort, filters, updateURL]);

  const handleFilter = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    setPage(1);
  };

  const columns = [
    { key: "id", title: "شناسه مرجوعی", sortable: true },
    { key: "order_id", title: "شماره سفارش", sortable: true },
    { key: "user_name", title: "کاربر", sortable: true },
    { key: "reason", title: "علت", sortable: true },
    {
      key: "amount",
      title: "مبلغ",
      sortable: true,
      render: (item: any) => `${formatNumberToPersian(item.amount)} تومان`,
    },
    {
      key: "status",
      title: "وضعیت",
      sortable: true,
      render: (item: any) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          pending: { label: "در انتظار بررسی", className: "bg-yellow-100 text-yellow-700" },
          approved: { label: "تأیید شده", className: "bg-green-100 text-green-700" },
          rejected: { label: "رد شده", className: "bg-red-100 text-red-700" },
          refunded: { label: "مبلغ برگشت داده شد", className: "bg-blue-100 text-blue-700" },
        };
        const status = statusMap[item.status] || {
          label: item.status,
          className: "bg-gray-100 text-gray-700",
        };
        return <Badge className={status.className}>{status.label}</Badge>;
      },
    },
    {
      key: "created_at",
      title: "تاریخ ثبت",
      sortable: true,
      render: (item: any) => toPersianDigits(item.created_at),
    },
  ];

  const renderActions = (item: any) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/orders/returns/${item.id}`)}
      >
        <Eye className="h-4 w-4" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "order_id", label: "شماره سفارش", type: "text" },
    { name: "user_name", label: "کاربر", type: "text" },
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: [
        { id: "pending", title: "در انتظار بررسی" },
        { id: "approved", title: "تأیید شده" },
        { id: "rejected", title: "رد شده" },
        { id: "refunded", title: "مبلغ برگشت داده شد" },
      ],
      valueKey: "id",
      labelKey: "title",
    },
    {
      name: "created_at",
      label: "بازه تاریخ",
      type: "date-time-range",
      colSpan: 2,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مرجوعی‌های سفارشات</h1>

      <FilterBar
        fields={filterFields}
        onFilter={handleFilter}
        initialValues={filters}
      />

      <DataTable
        columns={columns}
        data={data?.returns || []}
        totalCount={data?.total || 0}
        pageSize={limit}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size);
          setPage(1);
        }}
        onSort={(key, order) => {
          setSort({ key, order });
          setPage(1);
        }}
        sortKey={sort.key}
        sortOrder={sort.order}
        isLoading={isLoading}
        actions={renderActions}
        toolbarActions={
          <>
            <AppButton
              variant="soft-blue"
              onClick={() => exportToCSV(data?.returns || [])}
            >
              <Download className="ml-2 h-4 w-4" />
              خروجی Excel
            </AppButton>
            <AppButton variant="ghost" onClick={() => router.refresh()}>
              <RefreshCw className="ml-2 h-4 w-4" />
              تازه‌سازی
            </AppButton>
          </>
        }
      />
    </div>
  );
}