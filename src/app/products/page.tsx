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
import { formatNumberToPersian } from "@/lib/format";
import { serializeFilters, deserializeFilters } from "@/lib/filter-utils";
import Swal from "sweetalert2";
import { toast } from "sonner";

// تعریف configs برای فیلدهای select/multi-select
const filterFieldConfigs: Record<string, { type: string; isMulti?: boolean }> = {
  category_ids: { type: "multi-select", isMulti: true },
  status: { type: "select" },
};

// خروجی CSV
const exportToCSV = (products: any[]) => {
  if (!products.length) return;
  const headers = ["شناسه", "نام", "قیمت", "دسته‌بندی", "وضعیت"];
  const rows = products.map((p) => [
    p.id,
    p.name,
    p.price,
    p.category?.title || "-",
    p.is_active ? "فعال" : "غیرفعال",
  ]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "products.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // خواندن اولیه از URL
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "name";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const initialFilters = deserializeFilters(searchParams, filterFieldConfigs);

  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  // دریافت دسته‌بندی‌ها از backend
  const { data: categoriesData, isLoading: categoriesLoading } = useApiQuery<{
    categories: any[];
  }>("/categories", ["categories"]);

  // تبدیل دسته‌بندی‌ها به فرمت Option برای SelectInput
  const categoryOptions = (categoriesData?.categories || []).map((cat: any) => ({
    value: String(cat.id),
    label: cat.title,
    ...cat,
  }));

  // دریافت محصولات با فیلترها
  const { data, isLoading } = useApiQuery<{ products: any[]; total: number }>(
    "/products",
    ["products"],
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
    (
      p: number,
      l: number,
      s: { key: string; order: "asc" | "desc" },
      f: Record<string, any>
    ) => {
      const params = serializeFilters(f, filterFieldConfigs);
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "name" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }

      router.replace(
        `/products${params.toString() ? `?${params.toString()}` : ""}`,
        { scroll: false }
      );
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
      await apiClient.delete(`/products/${id}`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.refetchQueries({ queryKey: ["products"] });
      toast.success("محصول با موفقیت حذف شد");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف محصول");
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "نام", sortable: true },
    {
      key: "price",
      title: "قیمت",
      sortable: true,
      render: (product: any) => `${formatNumberToPersian(product.price)} تومان`,
    },
    {
      key: "category_id",
      title: "دسته‌بندی",
      sortable: true,
      render: (product: any) => product.category?.title || "-",
    },
    {
      key: "is_active",
      title: "وضعیت",
      sortable: true,
      render: (product: any) => (
        <Badge
          className={product.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
        >
          {product.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (product: any) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/products/${product.id}`)}
      >
        <Eye className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/products/${product.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(product.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "name", label: "نام", type: "text" },
    {
      name: "category_ids",
      label: "دسته‌بندی‌ها",
      type: "multi-select",
      options: categoryOptions,
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
        data={data?.products || []}
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
              onClick={() => router.push("/products/create")}
            >
              <Plus className="h-4 w-4" />
              محصول جدید
            </AppButton>
            <AppButton
              variant="soft-green"
              onClick={() => exportToCSV(data?.products || [])}
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