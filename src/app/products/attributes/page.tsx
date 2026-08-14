"use client";

import { useState, useEffect, useCallback } from "react";
import { useAttributes } from "@/hooks/useAttributes";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

export default function AttributesPage() {
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

  const { data, isLoading } = useAttributes({ page, limit, sort, filters });

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
      router.replace(`/products/attributes${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
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
    const res = await fetch(`/api/attributes/${id}`, { method: "DELETE" });
    if (res.ok) {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      await queryClient.refetchQueries({ queryKey: ["attributes"] });
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "title", title: "عنوان", sortable: true },
    {
      key: "type",
      title: "نوع",
      sortable: true,
      render: (attribute: any) => {
        const types: Record<string, string> = {
          text: "متنی",
          number: "عددی",
          boolean: "بله/خیر",
          select: "انتخابی",
        };
        return types[attribute.type] || attribute.type;
      },
    },
    {
      key: "is_active",
      title: "وضعیت",
      sortable: true,
      render: (attribute: any) => (
        <Badge className={attribute.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
          {attribute.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (attribute: any) => (
    <div className="flex justify-center gap-2">
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/products/attributes/${attribute.id}`)}>
        <Eye className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/products/attributes/${attribute.id}/edit`)}>
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => handleDelete(attribute.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "title", label: "عنوان", type: "text" },
    {
      name: "type",
      label: "نوع",
      type: "select",
      options: [
        { value: "text", label: "متنی" },
        { value: "number", label: "عددی" },
        { value: "boolean", label: "بله/خیر" },
        { value: "select", label: "انتخابی" },
      ],
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
      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.attributes || []}
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
              onClick={() => router.push("/products/attributes/create")}
            >
              <Plus className="h-4 w-4" />
              ویژگی جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}