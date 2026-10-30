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
import { Pencil, Trash2, Plus, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatNumberToPersian } from "@/lib/format";

// ==================== تایپ‌ها ====================
interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  title?: string;
  persian_title?: string;
  price: number;
  discounted_price?: number | null;
  category_id: number;
  category?: Category | null;
  stock_count: number;
  enabled: boolean;
  is_new?: boolean;
  is_best_seller?: boolean;
  is_featured?: boolean;
}

interface ProductsResponse {
  products: Product[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

// ==================== توابع کمکی ====================
function serializeFilterValue(value: FilterValue): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value.join(",");
  }
  return String(value);
}

function deserializeFilters(searchParams: URLSearchParams): Filters {
  const filters: Filters = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    filters[key] = value;
  });
  return filters;
}

// گزینه‌های boolean برای فیلتر
const booleanFilterOptions = [
  { value: "true", label: "بله" },
  { value: "false", label: "خیر" },
];

export default function ProductsPage() {
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

  // دریافت دسته‌بندی‌ها
  const { data: categoriesData } = useApiQuery<Category[]>(
    "/admin/categories/all",
    ["categories-list"]
  );

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>();
    categoriesData?.forEach((cat) => map.set(cat.id, cat.name));
    return map;
  }, [categoriesData]);

  const { data, isLoading } = useApiQuery<ProductsResponse>(
    "/admin/products",
    ["products"],
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
      router.replace(`/products${qs ? `?${qs}` : ""}`, { scroll: false });
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
      text: "این محصول حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/products/${id}`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.refetchQueries({ queryKey: ["products"] });
      toast.success("محصول با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف محصول");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "عنوان", sortable: true },
    { key: "persian_title", title: "عنوان فارسی", sortable: true },
    {
      key: "price",
      title: "قیمت",
      sortable: true,
      render: (product: Product) =>
        `${formatNumberToPersian(product.price)} تومان`,
    },
    {
      key: "discounted_price",
      title: "قیمت با تخفیف",
      sortable: true,
      render: (product: Product) =>
        product.discounted_price
          ? `${formatNumberToPersian(product.discounted_price)} تومان`
          : "-",
    },
    {
      key: "stock_count",
      title: "موجودی",
      sortable: true,
      render: (product: Product) => formatNumberToPersian(product.stock_count),
    },
    {
      key: "category_id",
      title: "دسته‌بندی",
      sortable: true,
      render: (product: Product) =>
        product.category?.name || categoryMap.get(product.category_id) || "-",
    },
    {
      key: "is_new",
      title: "جدید",
      sortable: true,
      render: (product: Product) =>
        product.is_new ? (
          <Badge className="bg-blue-100 text-blue-700">جدید</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "is_best_seller",
      title: "پرفروش",
      sortable: true,
      render: (product: Product) =>
        product.is_best_seller ? (
          <Badge className="bg-orange-100 text-orange-700">پرفروش</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "is_featured",
      title: "ویژه",
      sortable: true,
      render: (product: Product) =>
        product.is_featured ? (
          <Badge className="bg-purple-100 text-purple-700">ویژه</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "enabled",
      title: "وضعیت",
      sortable: true,
      render: (product: Product) => (
        <Badge
          className={
            product.enabled
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {product.enabled ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (product: Product) => (
    <div className="flex justify-center gap-2">
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

  const categoryOptions = (categoriesData || []).map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  const filterFields: FilterField[] = [
    { name: "name", label: "عنوان", type: "text" },
    { name: "persian_title", label: "عنوان فارسی", type: "text" },
    {
      name: "category_ids",
      label: "دسته‌بندی",
      type: "multi-select",
      options: categoryOptions,
      valueKey: "value",
      labelKey: "label",
      isSearchable: true,
    },
    {
      name: "is_new",
      label: "جدید",
      type: "select",
      options: booleanFilterOptions,
      valueKey: "value",
      labelKey: "label",
    },
    {
      name: "is_best_seller",
      label: "پرفروش",
      type: "select",
      options: booleanFilterOptions,
      valueKey: "value",
      labelKey: "label",
    },
    {
      name: "is_featured",
      label: "ویژه",
      type: "select",
      options: booleanFilterOptions,
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
              variant="green"
              onClick={() => {
                if (data?.products) {
                  const headers = ["شناسه", "عنوان", "قیمت", "موجودی", "وضعیت"];
                  const rows = data.products.map((p) => [
                    p.id,
                    p.name,
                    p.price,
                    p.stock_count,
                    p.enabled ? "فعال" : "غیرفعال",
                  ]);
                  const csv =
                    "data:text/csv;charset=utf-8," +
                    [headers.join(","), ...rows.map((r) => r.join(","))].join(
                      "\n"
                    );
                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csv));
                  link.setAttribute("download", "products.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
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