"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiQuery, useApiMutation, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { formatNumberToPersian } from "@/lib/format";

export default function ShippingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // state ها
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "name";
  const initialSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const initialFilters: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    initialFilters[key] = value;
  });

  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(initialFilters);

  const { data, isLoading } = useApiQuery<{ shipping_methods: any[]; total: number }>(
    "/shipping",
    ["shipping"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  // همگام‌سازی URL
  const updateURL = useCallback(
    (p: number, l: number, s: { key: string; order: "asc" | "desc" }, f: Record<string, any>) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "name" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) params.set(key, String(value));
      });
      router.replace(`/shipping${params.toString() ? `?${params.toString()}` : ""}`, {
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
      // رفع خطا: پاس دادن undefined به mutateAsync
      await apiClient.delete(`/shipping/${id}`);
      queryClient.invalidateQueries({ queryKey: ["shipping"] });
      await queryClient.refetchQueries({ queryKey: ["shipping"] });
      toast.success("روش ارسال حذف شد");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف روش ارسال");
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "نام روش ارسال", sortable: true },
    {
      key: "cost",
      title: "هزینه",
      sortable: true,
      render: (item: any) => `${formatNumberToPersian(item.cost)} تومان`,
    },
    { key: "delivery_time", title: "زمان تحویل", sortable: true },
    {
      key: "is_active",
      title: "وضعیت",
      sortable: true,
      render: (item: any) => (
        <Badge className={item.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
          {item.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (item: any) => (
    <div className="flex justify-center gap-2">
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/shipping/${item.id}`)}>
        <Eye className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/shipping/${item.id}/edit`)}>
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "name", label: "نام روش", type: "text" },
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
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">حمل‌ونقل و روش‌های ارسال</h1>

      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.shipping_methods || []}
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
            <AppButton variant="blue" onClick={() => router.push("/shipping/create")}>
              <Plus className="ml-2 h-4 w-4" />
              روش ارسال جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}