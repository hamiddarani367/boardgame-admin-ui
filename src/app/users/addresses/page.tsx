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
import {  Pencil, Trash2, Plus } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toPersianDigits } from "@/lib/format";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌های داده‌ها ====================
interface User {
  id: number;
  phone: string;
}

interface Province {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

interface Address {
  id: number;
  user_id: number;
  title?: string;
  full_address: string;
  province?: Province | null;
  city?: City | null;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
}

interface AddressesResponse {
  addresses: Address[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

// ==================== توابع کمکی برای فیلترها ====================
function serializeFilterValue(value: FilterValue): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.join(",");
  }
  // برای DateRangeValue در این صفحه استفاده نمی‌شود
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

export default function AddressesPage() {
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

  // دریافت کاربران برای فیلتر
  const { data: usersData, isLoading: usersLoading } = useApiQuery<User[]>(
    "/users/all",
    ["users-list"]
  );

  // ساخت گزینه‌های کاربران
  const userOptions = (usersData || []).map((user) => ({
    value: String(user.id),
    label: user.phone,
  }));

  // دریافت آدرس‌ها
  const { data, isLoading } = useApiQuery<AddressesResponse>(
    "/admin/addresses",
    ["addresses"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
      ...filters,
    }
  );

  // همگام‌سازی URL
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
        if (serialized !== null) {
          params.set(key, serialized);
        }
      });

      const qs = params.toString();
      router.replace(`/users/addresses${qs ? `?${qs}` : ""}`, {
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
      text: "این عملیات قابل بازگشت نیست!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/addresses/${id}`);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      await queryClient.refetchQueries({ queryKey: ["addresses"] });
      toast.success("آدرس با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف آدرس");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "user_id", title: "کاربر", sortable: true },
    { key: "full_address", title: "آدرس", sortable: true },
    {
      key: "province",
      title: "استان",
      sortable: true,
      render: (addr: Address) => addr.province?.name || "-",
    },
    {
      key: "city",
      title: "شهر",
      sortable: true,
      render: (addr: Address) => addr.city?.name || "-",
    },
    {
      key: "postal_code",
      title: "کد پستی",
      sortable: true,
      render: (addr: Address) => toPersianDigits(addr.postal_code || ""),
    },
    {
      key: "is_default",
      title: "پیش‌فرض",
      sortable: true,
      render: (addr: Address) => (
        <Badge
          className={
            addr.is_default
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }
        >
          {addr.is_default ? "بله" : "خیر"}
        </Badge>
      ),
    },
  ];

  const renderActions = (addr: Address) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/users/addresses/${addr.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(addr.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    {
      name: "user_ids",
      label: "کاربران",
      type: "multi-select",
      options: userOptions,
      valueKey: "value",
      labelKey: "label",
      isSearchable: true,
    },
    {
      name: "is_default",
      label: "پیش‌فرض",
      type: "select",
      options: [
        { value: "true", label: "بله" },
        { value: "false", label: "خیر" },
      ],
      valueKey: "value",
      labelKey: "label",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">آدرس‌ها</h1>

      <FilterBar
        fields={filterFields}
        onFilter={handleFilter}
        initialValues={filters}
      />

      <DataTable
        columns={columns}
        data={data?.addresses || []}
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
              onClick={() => router.push("/users/addresses/create")}
            >
              <Plus className="h-4 w-4" />
              آدرس جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}