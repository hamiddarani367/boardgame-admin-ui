"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
import { toPersianDigits } from "@/lib/format";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌ها ====================
interface Gateway {
  id: number;
  name: string;
  slug: string;
  type: string;
  config: string;
  enabled: boolean;
  sort_order: number;
}

interface GatewayListResponse {
  gateways: Gateway[];
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

export default function GatewaysPage() {
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

  const { data, isLoading } = useApiQuery<GatewayListResponse>(
    "/admin/gateways",
    ["gateways"],
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
      router.replace(`/finance/gateways${qs ? `?${qs}` : ""}`, { scroll: false });
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
      text: "این درگاه حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/gateways/${id}`);
      queryClient.invalidateQueries({ queryKey: ["gateways"] });
      await queryClient.refetchQueries({ queryKey: ["gateways"] });
      toast.success("درگاه با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف درگاه");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "نام درگاه", sortable: true },
    { key: "slug", title: "اسلاگ", sortable: true },
    {
      key: "type",
      title: "نوع",
      sortable: true,
      render: (gateway: Gateway) => {
        const typeMap: Record<string, string> = {
          online: "آنلاین",
          offline: "آفلاین",
          cash: "نقدی",
        };
        return typeMap[gateway.type] || gateway.type;
      },
    },
    {
      key: "sort_order",
      title: "ترتیب",
      sortable: true,
      render: (gateway: Gateway) => toPersianDigits(gateway.sort_order),
    },
    {
      key: "enabled",
      title: "وضعیت",
      sortable: true,
      render: (gateway: Gateway) => (
        <Badge
          className={
            gateway.enabled
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {gateway.enabled ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (gateway: Gateway) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/finance/gateways/${gateway.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(gateway.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "name", label: "نام درگاه", type: "text" },
    {
      name: "type",
      label: "نوع",
      type: "select",
      options: [
        { value: "online", label: "آنلاین" },
        { value: "offline", label: "آفلاین" },
        { value: "cash", label: "نقدی" },
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
      <FilterBar
        fields={filterFields}
        onFilter={handleFilter}
        initialValues={filters}
      />

      <DataTable
        columns={columns}
        data={data?.gateways || []}
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
              onClick={() => router.push("/finance/gateways/create")}
            >
              <Plus className="h-4 w-4" />
              درگاه جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}