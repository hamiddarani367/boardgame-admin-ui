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

const exportToCSV = (orders: any[]) => {
  if (!orders.length) return;
  const headers = ["شماره سفارش", "مشتری", "مبلغ", "وضعیت", "تاریخ"];
  const rows = orders.map((o) => [
    o.id,
    o.customer_name,
    o.total_amount,
    o.status,
    o.created_at,
  ]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "orders.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function OrdersPage() {
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

  const { data, isLoading } = useApiQuery<{ orders: any[]; total: number }>(
    "/orders",
    ["orders"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  const updateURL = useCallback(
    (p: number, l: number, s: { key: string; order: "asc" | "desc" }, f: Record<string, any>) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "desc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) params.set(key, String(value));
      });
      router.replace(`/orders${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
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
    { key: "id", title: "شماره سفارش", sortable: true },
    { key: "customer_name", title: "مشتری", sortable: true },
    {
      key: "total_amount",
      title: "مبلغ",
      sortable: true,
      render: (order: any) => `${formatNumberToPersian(order.total_amount)} تومان`,
    },
    {
      key: "status",
      title: "وضعیت",
      sortable: true,
      render: (order: any) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          pending: { label: "در انتظار پرداخت", className: "bg-yellow-100 text-yellow-700" },
          paid: { label: "پرداخت شده", className: "bg-green-100 text-green-700" },
          shipped: { label: "ارسال شده", className: "bg-blue-100 text-blue-700" },
          delivered: { label: "تحویل شده", className: "bg-purple-100 text-purple-700" },
          canceled: { label: "لغو شده", className: "bg-red-100 text-red-700" },
        };
        const status = statusMap[order.status] || { label: order.status, className: "bg-gray-100 text-gray-700" };
        return <Badge className={status.className}>{status.label}</Badge>;
      },
    },
    {
      key: "created_at",
      title: "تاریخ",
      sortable: true,
      render: (order: any) => toPersianDigits(order.created_at),
    },
  ];

  const renderActions = (order: any) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/orders/${order.id}`)}
      >
        <Eye className="h-4 w-4" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "customer_name", label: "مشتری", type: "text" },
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: [
        { id: "pending", title: "در انتظار پرداخت" },
        { id: "paid", title: "پرداخت شده" },
        { id: "shipped", title: "ارسال شده" },
        { id: "delivered", title: "تحویل شده" },
        { id: "canceled", title: "لغو شده" },
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
      <h1 className="text-2xl font-bold">سفارشات</h1>

      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.orders || []}
        totalCount={data?.total || 0}
        pageSize={limit}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={(size) => { setLimit(size); setPage(1); }}
        onSort={(key, order) => { setSort({ key, order }); setPage(1); }}
        sortKey={sort.key}
        sortOrder={sort.order}
        isLoading={isLoading}
        actions={renderActions}
        toolbarActions={
          <>
            <AppButton variant="soft-blue" onClick={() => exportToCSV(data?.orders || [])}>
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