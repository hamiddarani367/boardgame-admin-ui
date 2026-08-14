"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toPersianDigits } from "@/lib/format";
import Swal from "sweetalert2";
import { toast } from "sonner";

export default function AddressesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // state ها (مانند قبل)
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const initialFilters: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    initialFilters[key] = value;
  });

  const [sort, setSort] = useState({ key: initialSortBy, order: initialSortOrder });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(initialFilters);

  const { data, isLoading } = useApiQuery<{ addresses: any[]; total: number }>(
    "/addresses",
    ["addresses"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  const updateURL = useCallback(
    (p: number, l: number, s: { key: string; order: "asc" | "desc" }, f: Record<string, any>) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) params.set(key, String(value));
      });
      router.replace(`/users/addresses${params.toString() ? `?${params.toString()}` : ""}`, {
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
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف آدرس");
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "user_name", title: "کاربر", sortable: true },
    { key: "address", title: "آدرس", sortable: true },
    { key: "city", title: "شهر", sortable: true },
    {
      key: "postal_code",
      title: "کد پستی",
      sortable: true,
      render: (addr: any) => toPersianDigits(addr.postal_code),
    },
    {
      key: "is_default",
      title: "پیش‌فرض",
      sortable: true,
      render: (addr: any) => (
        <Badge className={addr.is_default ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
          {addr.is_default ? "بله" : "خیر"}
        </Badge>
      ),
    },
  ];

  const renderActions = (addr: any) => (
    <div className="flex justify-center gap-2">
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/users/addresses/${addr.id}`)}>
        <Eye className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/users/addresses/${addr.id}/edit`)}>
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => handleDelete(addr.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "user_name", label: "کاربر", type: "text" },
    { name: "city", label: "شهر", type: "text" },
    {
      name: "is_default",
      label: "پیش‌فرض",
      type: "select",
      options: [
        { id: "true", title: "بله" },
        { id: "false", title: "خیر" },
      ],
      valueKey: "id",
      labelKey: "title",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">آدرس‌ها</h1>

      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.addresses || []}
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
            <AppButton variant="blue" onClick={() => router.push("/users/addresses/create")}>
              <Plus className="h-4 w-4" />
              آدرس جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}