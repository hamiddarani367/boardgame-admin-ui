"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus, Download } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toPersianDigits } from "@/lib/format";
import { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useRoles } from "@/hooks/useRoles";

// ==================== تایپ‌ها ====================
interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  enabled: boolean;
  created_at?: string;
}

interface UsersResponse {
  users: User[];
  total: number;
}

interface DateRange {
  from: DateObject | null;
  to: DateObject | null;
}

type FilterValue = string | string[] | DateRange | null;
type Filters = Record<string, FilterValue>;

interface SortState {
  key: string;
  order: "asc" | "desc";
}

// ==================== سریالایز فیلترها ====================
function serializeFilterValue(value: FilterValue): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.join(",");
  }
  if (typeof value === "object" && "from" in value && "to" in value) {
    return null; // در updateURL پردازش می‌شود
  }
  return String(value);
}

function deserializeFilters(searchParams: URLSearchParams): Filters {
  const filters: Filters = {};

  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;

    if (key.endsWith("_from") || key.endsWith("_to")) {
      const mainKey = key.replace(/_from$|_to$/, "");
      if (!filters[mainKey]) {
        filters[mainKey] = { from: null, to: null } as DateRange;
      }
      const range = filters[mainKey] as DateRange;
      if (key.endsWith("_from")) {
        range.from = new DateObject({
          date: new Date(value),
          calendar: persian,
          locale: persian_fa,
        });
      } else {
        range.to = new DateObject({
          date: new Date(value),
          calendar: persian,
          locale: persian_fa,
        });
      }
      return;
    }

    if (value.includes(",")) {
      filters[key] = value.split(",");
    } else {
      filters[key] = value;
    }
  });

  return filters;
}

// ==================== خروجی CSV ====================
const exportToCSV = (users: User[]) => {
  if (!users.length) return;
  const headers = ["شناسه", "نام", "نام خانوادگی", "موبایل", "ایمیل", "وضعیت"];
  const rows = users.map((user) => [
    user.id,
    user.first_name,
    user.last_name,
    user.phone,
    user.email,
    user.enabled ? "فعال" : "غیرفعال",
  ]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "users.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function UsersPage() {
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

  // دریافت لیست کاربران
  const { data, isLoading } = useApiQuery<UsersResponse>(
    "/users",
    ["users"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
      ...filters,
    }
  );

  const { data: rolesData } = useRoles();
    const roleOptions = (rolesData || []).map((role) => ({
      value: String(role.id),
      label: role.name,
      ...role,
    }));

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
        if (value === null || value === undefined || value === "") return;

        if (typeof value === "object" && "from" in value && "to" in value) {
          const range = value as DateRange;
          if (range.from) params.set(`${key}_from`, range.from.toDate().toISOString());
          if (range.to) params.set(`${key}_to`, range.to.toDate().toISOString());
          return;
        }

        const serialized = serializeFilterValue(value);
        if (serialized !== null) {
          params.set(key, serialized);
        }
      });

      const qs = params.toString();
      router.replace(`/users${qs ? `?${qs}` : ""}`, { scroll: false });
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
      await apiClient.delete(`/users/${id}`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      await queryClient.refetchQueries({ queryKey: ["users"] });
      toast.success("کاربر با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در حذف کاربر");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    {
      key: "first_name",
      title: "نام",
      sortable: true,
      render: (user: User) => user.first_name || "-",
    },
    {
      key: "last_name",
      title: "نام خانوادگی",
      sortable: true,
      render: (user: User) => user.last_name || "-",
    },
    {
      key: "phone",
      title: "موبایل",
      sortable: true,
      render: (user: User) => (
        <span dir="ltr">{toPersianDigits(user.phone)}</span>
      ),
    },
    {
      key: "email",
      title: "ایمیل",
      sortable: true,
      render: (user: User) => user.email || "-",
    },
    {
      key: "enabled",
      title: "وضعیت",
      sortable: true,
      render: (user: User) => (
        <Badge
          className={
            user.enabled
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {user.enabled ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (user: User) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/users/${user.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(user.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "id", label: "شناسه", type: "text" },
    { name: "phone", label: "موبایل", type: "text" },
    { name: "first_name", label: "نام", type: "text" },
    { name: "last_name", label: "نام خانوادگی", type: "text" },
    { name: "email", label: "ایمیل", type: "text" },
    {
      name: "role_ids",
      label: "نقش‌ها",
      type: "multi-select",
      options: roleOptions,
      valueKey: "id",
      labelKey: "name",
    },
    {
      name: "enabled",
      label: "وضعیت",
      type: "select",
      options: [
        { id: "true", title: "فعال" },
        { id: "false", title: "غیرفعال" },
      ],
      valueKey: "id",
      labelKey: "title",
    },
    {
      name: "created_at",
      label: "تاریخ ثبت‌نام",
      type: "date-time-range",
      colSpan: 2,
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
        data={data?.users || []}
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
              onClick={() => router.push("/users/create")}
            >
              <Plus className="h-4 w-4" />
              کاربر جدید
            </AppButton>
            <AppButton
              variant="green"
              onClick={() => exportToCSV(data?.users || [])}
            >
              <Download className="h-4 w-4" />
              خروجی Excel
            </AppButton>
          </>
        }
      />
    </div>
  );
}