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

const exportToCSV = (transactions: any[]) => {
  if (!transactions.length) return;
  const headers = ["شناسه تراکنش", "کاربر", "مبلغ", "نوع", "وضعیت", "تاریخ"];
  const rows = transactions.map((t) => [
    t.id,
    t.user_name,
    t.amount,
    t.type,
    t.status,
    t.created_at,
  ]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "transactions.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function TransactionsPage() {
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

  const { data, isLoading } = useApiQuery<{ transactions: any[]; total: number }>(
    "/finance/transactions",
    ["transactions"],
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
      router.replace(`/finance/transactions${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
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
    { key: "id", title: "شناسه تراکنش", sortable: true },
    { key: "user_name", title: "کاربر", sortable: true },
    {
      key: "amount",
      title: "مبلغ",
      sortable: true,
      render: (tx: any) => `${formatNumberToPersian(tx.amount)} تومان`,
    },
    {
      key: "type",
      title: "نوع",
      sortable: true,
      render: (tx: any) => (tx.type === "credit" ? "افزایش اعتبار" : "برداشت"),
    },
    {
      key: "status",
      title: "وضعیت",
      sortable: true,
      render: (tx: any) => {
        const statusMap: Record<string, { label: string; className: string }> = {
          success: { label: "موفق", className: "bg-green-100 text-green-700" },
          pending: { label: "در انتظار", className: "bg-yellow-100 text-yellow-700" },
          failed: { label: "ناموفق", className: "bg-red-100 text-red-700" },
        };
        const status = statusMap[tx.status] || { label: tx.status, className: "bg-gray-100 text-gray-700" };
        return <Badge className={status.className}>{status.label}</Badge>;
      },
    },
    {
      key: "created_at",
      title: "تاریخ",
      sortable: true,
      render: (tx: any) => toPersianDigits(tx.created_at),
    },
  ];

  const renderActions = (tx: any) => (
    <div className="flex justify-center gap-2">
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/finance/transactions/${tx.id}`)}>
        <Eye className="h-4 w-4" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "user_name", label: "کاربر", type: "text" },
    {
      name: "type",
      label: "نوع",
      type: "select",
      options: [
        { id: "credit", title: "افزایش اعتبار" },
        { id: "debit", title: "برداشت" },
      ],
      valueKey: "id",
      labelKey: "title",
    },
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: [
        { id: "success", title: "موفق" },
        { id: "pending", title: "در انتظار" },
        { id: "failed", title: "ناموفق" },
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
      <h1 className="text-2xl font-bold">تراکنش‌ها</h1>

      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.transactions || []}
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
            <AppButton
              variant="soft-blue"
              onClick={() => exportToCSV(data?.transactions || [])}
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