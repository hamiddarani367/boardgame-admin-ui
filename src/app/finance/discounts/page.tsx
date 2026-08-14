"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DiscountsPage() {
  const router = useRouter();

  // ✅ تایپ صریح برای sort
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: "id",
    order: "asc",
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState<Record<string, any>>({});

  const { data, isLoading } = useApiQuery<{ discounts: any[]; total: number }>(
    "/finance/discounts",
    ["discounts"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "code", title: "کد تخفیف", sortable: true },
    { key: "percent", title: "درصد", sortable: true },
    {
      key: "is_active",
      title: "وضعیت",
      sortable: true,
      render: (discount: any) => (
        <Badge className={discount.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
          {discount.is_active ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (discount: any) => (
    <div className="flex justify-center gap-2">
      <AppButton variant="ghost" size="icon" onClick={() => router.push(`/finance/discounts/${discount.id}/edit`)}>
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton variant="ghost" size="icon">
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "code", label: "کد تخفیف", type: "text" },
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
      <h1 className="text-2xl font-bold">تخفیف‌ها</h1>

      <FilterBar
        fields={filterFields}
        onFilter={(newFilters) => {
          setFilters(newFilters);
          setPage(1);
        }}
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
            <AppButton variant="blue" onClick={() => router.push("/finance/discounts/create")}>
              <Plus className="h-4 w-4" />
              تخفیف جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}