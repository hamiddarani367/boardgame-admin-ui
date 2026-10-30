"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import {
  FilterBar,
  type FilterField,
  type Filters,
  type FilterValue,
} from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface Discount {
  id: number;
  code: string;
  type: string;
  value: number;
  start_date?: string | null;
  end_date?: string | null;
  max_uses?: number;
  per_user_limit?: number;
  min_order_amount?: number;
  enabled: boolean;
}

interface DiscountsResponse {
  discounts: Discount[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

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
    if (value.includes(",")) {
      filters[key] = value.split(",");
    } else {
      filters[key] = value;
    }
  });
  return filters;
}

export default function DiscountsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const initialFilters = deserializeFilters(searchParams);

  const [sort, setSort] = useState<SortState>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const { data, isLoading } = useApiQuery<DiscountsResponse>(
    "/admin/discounts",
    ["discounts"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
      ...filters,
    }
  );

  const updateURL = useCallback(
    (p: number, l: number, s: SortState, f: Filters) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        const serialized = serializeFilterValue(value);
        if (serialized !== null) params.set(key, serialized);
      });
      const qs = params.toString();
      router.replace(`/finance/discounts${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
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

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این تخفیف حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/discounts/${id}`);
      queryClient.invalidateQueries({ queryKey: ["discounts"] });
      await queryClient.refetchQueries({ queryKey: ["discounts"] });
      toast.success("تخفیف با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف تخفیف");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "code", title: "کد تخفیف", sortable: true },
    {
      key: "type",
      title: "نوع",
      sortable: true,
      render: (discount: Discount) =>
        discount.type === "percentage" ? "درصدی" : "مبلغ ثابت",
    },
    {
      key: "value",
      title: "مقدار",
      sortable: true,
      render: (discount: Discount) =>
        discount.type === "percentage"
          ? `${discount.value}٪`
          : `${discount.value.toLocaleString("fa-IR")} تومان`,
    },
    {
      key: "enabled",
      title: "وضعیت",
      sortable: true,
      render: (discount: Discount) => (
        <Badge
          className={
            discount.enabled
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {discount.enabled ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (discount: Discount) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/finance/discounts/${discount.id}`)}
      >
        <Eye className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/finance/discounts/${discount.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(discount.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "code", label: "کد تخفیف", type: "text" },
    {
      name: "type",
      label: "نوع",
      type: "select",
      options: [
        { value: "percentage", label: "درصدی" },
        { value: "fixed", label: "مبلغ ثابت" },
      ],
      valueKey: "value",
      labelKey: "label",
    },
    {
      name: "enabled",
      label: "وضعیت",
      type: "select",
      options: [
        { value: "true", label: "فعال" },
        { value: "false", label: "غیرفعال" },
      ],
      valueKey: "value",
      labelKey: "label",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تخفیف‌ها</h1>

      <FilterBar
        fields={filterFields}
        onFilter={handleFilter}
        initialValues={filters}
      />

      <DataTable
        columns={columns}
        data={data?.discounts || []}
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
              variant="blue"
              onClick={() => router.push("/finance/discounts/create")}
            >
              <Plus className="h-4 w-4" />
              تخفیف جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}