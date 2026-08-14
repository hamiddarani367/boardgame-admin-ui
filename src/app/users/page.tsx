"use client";

import { useState, useEffect, useCallback } from "react";
import { useUsers } from "@/hooks/useUsers";
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

const exportToCSV = (users: any[]) => {
  if (!users.length) return;
  const headers = ["شناسه", "نام", "موبایل", "نقش‌ها", "وضعیت"];
  const rows = users.map((u) => [
    u.id,
    u.name,
    u.mobile,
    u.roles?.map((r: any) => r.title).join("، ") || "-",
    u.is_active ? "فعال" : "غیرفعال",
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
  const initialSortBy = searchParams.get("sortBy") || "name";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const initialFilters: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;

    if (key.endsWith("_from") || key.endsWith("_to")) {
      const mainKey = key.replace(/_from$|_to$/, "");
      if (!initialFilters[mainKey]) initialFilters[mainKey] = { from: null, to: null };
      if (key.endsWith("_from")) {
        initialFilters[mainKey].from = new DateObject({
          date: new Date(value),
          calendar: persian,
          locale: persian_fa,
        });
      } else {
        initialFilters[mainKey].to = new DateObject({
          date: new Date(value),
          calendar: persian,
          locale: persian_fa,
        });
      }
    } else {
      initialFilters[key] = value.includes(",") ? value.split(",") : value;
    }
  });

  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  const { data, isLoading, refetch } = useUsers({ page, limit, sort, filters });

  useEffect(() => {
    refetch();
  }, []);

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
      if (s.key !== "name" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }

      Object.entries(f).forEach(([key, value]) => {
        if (value === "" || value === undefined || value === null) return;

        if (
          typeof value === "object" &&
          value !== null &&
          "from" in value &&
          "to" in value
        ) {
          if (value.from) params.set(`${key}_from`, value.from.toDate().toISOString());
          if (value.to) params.set(`${key}_to`, value.to.toDate().toISOString());
          return;
        }

        if (Array.isArray(value)) {
          if (value.length === 0) return;
          const ids = value.map((v: any) =>
            typeof v === "object" ? v.id ?? v.value : v
          );
          params.set(key, ids.join(","));
          return;
        }

        if (typeof value === "object" && value !== null) {
          params.set(key, String(value.id ?? value.value));
        } else {
          params.set(key, String(value));
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

  const handleFilter = (newFilters: Record<string, any>) => {
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
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        await queryClient.refetchQueries({ queryKey: ["users"] });
        toast.success("کاربر با موفقیت حذف شد");
      } else {
        const err = await res.json();
        toast.error(err.error || "خطا در حذف کاربر");
      }
    } catch (error) {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "نام", sortable: true },
    {
      key: "mobile",
      title: "موبایل",
      sortable: true,
      render: (user: any) => (
        <span dir="ltr">{toPersianDigits(user.mobile)}</span>
      ),
    },
    {
      key: "roles",
      title: "نقش‌ها",
      sortable: true,
      render: (user: any) => (
        <span>{user.roles?.map((r: any) => r.title).join("، ") || "-"}</span>
      ),
    },
    {
      key: "is_active",
      title: "وضعیت",
      sortable: true,
      render: (user: any) => (
        <Badge
          className={
            user.is_active
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {user.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (user: any) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/users/${user.id}`)}
      >
        <Eye className="h-4 w-4" />
      </AppButton>
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
    { name: "name", label: "نام", type: "text" },
    { name: "mobile", label: "موبایل", type: "text" },
    {
      name: "role",
      label: "نقش‌ها",
      type: "multi-select",
      options: [
        { id: 1, title: "ادمین" },
        { id: 2, title: "کاربر" },
        { id: 3, title: "ویرایشگر" },
      ],
      valueKey: "id",
      labelKey: "title",
    },
    {
      name: "status",
      label: "وضعیت",
      type: "select",
      options: [
        { id: "active", title: "فعال" },
        { id: "inactive", title: "غیرفعال" },
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">کاربران</h1>
      </div>

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