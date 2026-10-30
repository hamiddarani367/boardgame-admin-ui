"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import {
  FilterBar,
  type FilterField,
  type Filters,
  type FilterValue,
} from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Download, RefreshCw, MoreVertical, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatNumberToPersian } from "@/lib/format";
import { toPersianDateTime } from "@/lib/date";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌ها ====================
interface OrderUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: number;
  discounted_price: number;
  quantity: number;
  total_price: number;
  savings: number;
}

interface Order {
  id: number;
  user_id: number;
  user: OrderUser;
  status: string;
  total_amount: number;
  total_savings: number;
  discount_amount: number;
  final_amount: number;
  gateway_id: number;
  payment_authority: string;
  payment_ref_id?: string;
  address_id: number;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

interface UpdateOrderStatusPayload {
  status: string;
}

// ==================== وضعیت‌ها ====================
const statusMap: Record<string, { label: string; className: string }> = {
  cart: { label: "سبد خرید", className: "bg-gray-100 text-gray-700" },
  pending: { label: "در انتظار پرداخت", className: "bg-yellow-100 text-yellow-700" },
  awaiting_cash: { label: "در انتظار پرداخت نقدی", className: "bg-amber-100 text-amber-700" },
  paid: { label: "پرداخت شده", className: "bg-green-100 text-green-700" },
  shipped: { label: "ارسال شده", className: "bg-blue-100 text-blue-700" },
  delivered: { label: "تحویل شده", className: "bg-purple-100 text-purple-700" },
  canceled: { label: "لغو شده", className: "bg-red-100 text-red-700" },
  refunded: { label: "بازگشت داده شده", className: "bg-pink-100 text-pink-700" },
};

const statusOptions = [
  { value: "pending", label: "در انتظار پرداخت" },
  { value: "awaiting_cash", label: "در انتظار پرداخت نقدی" },
  { value: "paid", label: "پرداخت شده" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "canceled", label: "لغو شده" },
  { value: "refunded", label: "بازگشت داده شده" },
];

// ==================== توابع کمکی ====================
function serializeFilterValue(value: FilterValue): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.join(",");
  }
  if (typeof value === "object") return null;
  return String(value);
}

function deserializeFilters(searchParams: URLSearchParams): Filters {
  const filters: Filters = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    filters[key] = value;
  });
  return filters;
}

const exportToCSV = (orders: Order[]) => {
  if (!orders.length) return;
  const headers = [
    "شماره سفارش",
    "مشتری",
    "تلفن",
    "تعداد اقلام",
    "مبلغ کل",
    "صرفه‌جویی",
    "مبلغ نهایی",
    "وضعیت",
    "تاریخ ثبت",
  ];
  const rows = orders.map((o) => [
    o.id,
    o.user?.full_name ?? "-",
    o.user?.phone ?? "-",
    o.items?.length ?? 0,
    o.total_amount,
    o.total_savings,
    o.final_amount,
    statusMap[o.status]?.label ?? o.status,
    toPersianDateTime(o.created_at),
  ]);
  const csv =
    "\uFEFF" + // BOM برای Excel
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "orders.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ==================== کامپوننت ====================
export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const initialFilters = deserializeFilters(searchParams);

  const [sort, setSort] = useState<SortState>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const { data, isLoading } = useApiQuery<OrdersResponse>(
    "/admin/orders",
    ["orders"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  const updateURL = useCallback(
    (p: number, l: number, s: SortState, f: Filters) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "desc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        const serialized = serializeFilterValue(value);
        if (serialized !== null) params.set(key, serialized);
      });
      const qs = params.toString();
      router.replace(`/orders${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    updateURL(page, limit, sort, filters);
  }, [page, limit, sort, filters, updateURL]);

  const handleFilter = (newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  // ==================== ستون‌ها ====================
  const columns = [
    { key: "id", title: "شماره سفارش", sortable: true },
    {
      key: "user",
      title: "مشتری",
      sortable: true,
      render: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {order.user?.full_name ?? "-"}
          </span>
          {order.user?.phone && (
            <span className="text-xs text-gray-400" dir="ltr">
              {order.user.phone}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "items",
      title: "اقلام",
      sortable: false,
      render: (order: Order) => {
        const count = order.items?.reduce((sum, it) => sum + it.quantity, 0) ?? 0;
        return (
          <span className="text-sm">
            {formatNumberToPersian(count)} عدد
          </span>
        );
      },
    },
    {
      key: "total_amount",
      title: "مبلغ کل",
      sortable: true,
      render: (order: Order) =>
        `${formatNumberToPersian(order.total_amount)} تومان`,
    },
    {
      key: "final_amount",
      title: "مبلغ نهایی",
      sortable: true,
      render: (order: Order) => (
        <div className="flex flex-col">
          <span className="font-bold text-sm">
            {formatNumberToPersian(order.final_amount)} تومان
          </span>
          {order.total_savings > 0 && (
            <span className="text-xs text-green-600">
              صرفه‌جویی: {formatNumberToPersian(order.total_savings)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      title: "وضعیت",
      sortable: true,
      render: (order: Order) => {
        const status = statusMap[order.status] ?? {
          label: order.status,
          className: "bg-gray-100 text-gray-700",
        };
        return <Badge className={status.className}>{status.label}</Badge>;
      },
    },
    {
      key: "created_at",
      title: "تاریخ ثبت",
      sortable: true,
      render: (order: Order) => (
        <span className="text-xs">{toPersianDateTime(order.created_at)}</span>
      ),
    },
  ];

  // ==================== کامپوننت تغییر وضعیت ====================
  const StatusChanger = ({ order }: { order: Order }) => {
    const updateStatus = useApiMutation<unknown, UpdateOrderStatusPayload>(
      `/admin/orders/${order.id}/status`,
      "PATCH",
      ["orders"]
    );

    const handleChange = async (status: string) => {
      if (status === order.status) return;

      try {
        await updateStatus.mutateAsync({ status });
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        await queryClient.refetchQueries({ queryKey: ["orders"] });
        const label = statusMap[status]?.label ?? status;
        toast.success(`وضعیت سفارش به «${label}» تغییر یافت`);
      } catch (error) {
        if (error instanceof AxiosError) {
          const responseData = error.response?.data as
            | { error?: string }
            | undefined;
          toast.error(responseData?.error ?? "خطا در تغییر وضعیت سفارش");
        } else {
          toast.error("خطا در تغییر وضعیت سفارش");
        }
      }
    };

    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={updateStatus.isPending}
          title="تغییر وضعیت"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {updateStatus.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreVertical className="h-4 w-4" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {statusOptions.map((opt) => (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              disabled={opt.value === order.status}
              className={
                opt.value === order.status
                  ? "bg-muted font-bold cursor-default"
                  : "cursor-pointer"
              }
            >
              {opt.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderActions = (order: Order) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/orders/${order.id}`)}
        title="مشاهده"
      >
        <Eye className="h-4 w-4" />
      </AppButton>
      <StatusChanger order={order} />
    </div>
  );

  // ==================== فیلترها ====================
  const filterFields: FilterField[] = [
    { name: "customer_name", label: "مشتری", type: "text" },
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: statusOptions,
      valueKey: "value",
      labelKey: "label",
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

      <FilterBar
        fields={filterFields}
        onFilter={handleFilter}
        initialValues={filters}
      />

      <DataTable
        columns={columns}
        data={data?.orders ?? []}
        totalCount={data?.total ?? 0}
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
              onClick={() => exportToCSV(data?.orders ?? [])}
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