"use client";

import { useState, useEffect, useCallback } from "react";
import { useCategories } from "@/hooks/useCategories"; // هوک مخصوص لیست (در صورت وجود)
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useApiQuery } from "@/hooks/useApi";

// تعریف نوع Category (در صورت نیاز)
interface Category {
  id: number;
  title: string;
  description?: string;
  is_active: boolean;
  attributes: { id: number; title: string }[];
}

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "title";
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

  // استفاده از useApiQuery جامع یا هوک اختصاصی
  const { data, isLoading } = useApiQuery<{ categories: Category[]; total: number }>(
    "/api/categories",
    ["categories"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  // همگام‌سازی URL
  const updateURL = useCallback(
    (p: number, l: number, s: { key: string; order: "asc" | "desc" }, f: Record<string, any>) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "title" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) params.set(key, String(value));
      });
      router.replace(`/products/categories${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
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
    if (!confirm("آیا مطمئن هستید؟")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.refetchQueries({ queryKey: ["categories"] });
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "title", title: "عنوان", sortable: true },
    {
      key: "attributes",
      title: "ویژگی‌ها",
      sortable: false,
      render: (category: Category) => (
        <span>{category.attributes?.map((attr) => attr.title).join("، ") || "-"}</span>
      ),
    },
    {
      key: "is_active",
      title: "وضعیت",
      sortable: true,
      render: (category: Category) => (
        <Badge className={category.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
          {category.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (category: Category) => (
    <div className="flex justify-center gap-2">
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/products/categories/${category.id}`)}>
        <Eye className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/products/categories/${category.id}/edit`)}>
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "title", label: "عنوان", type: "text" },
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
      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.categories || []}
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
              onClick={() => router.push("/products/categories/create")}
            >
              <Plus className="h-4 w-4" />
              دسته بندی جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}