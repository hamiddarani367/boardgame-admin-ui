"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { formatNumberToPersian } from "@/lib/format";

// ==================== تایپ‌ها ====================
interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  light_bg?: string;
  light_text?: string;
  attribute_ids: number[];
  created_at?: number;
  updated_at?: number;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

// ==================== خروجی CSV ====================
const exportToCSV = (categories: Category[]) => {
  if (!categories.length) return;
  const headers = ["شناسه", "نام", "اسلاگ", "تعداد ویژگی‌ها"];
  const rows = categories.map((c) => [c.id, c.name, c.slug, c.attribute_ids.length]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "categories.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const [sort, setSort] = useState<SortState>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);

  const { data, isLoading } = useApiQuery<CategoriesResponse>(
    "/admin/categories",
    ["categories"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
    }
  );

  const updateURL = useCallback(
    (p: number, l: number, s: SortState) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      const qs = params.toString();
      router.replace(`/products/categories${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );

  useEffect(() => {
    updateURL(page, limit, sort);
  }, [page, limit, sort, updateURL]);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این دسته‌بندی حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/categories/${id}`);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      await queryClient.refetchQueries({ queryKey: ["categories"] });
      toast.success("دسته‌بندی با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف دسته‌بندی");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "نام", sortable: true },
    { key: "slug", title: "اسلاگ", sortable: true },
    {
      key: "attribute_ids",
      title: "ویژگی‌ها",
      sortable: false,
      render: (cat: Category) => (
        <Badge variant="secondary">
          {formatNumberToPersian(cat.attribute_ids.length)} ویژگی
        </Badge>
      ),
    },
  ];

  const renderActions = (cat: Category) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/products/categories/${cat.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(cat.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={data?.categories || []}
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
              onClick={() => router.push("/products/categories/create")}
            >
              <Plus className="h-4 w-4" />
              دسته‌بندی جدید
            </AppButton>
            <AppButton
              variant="green"
              onClick={() => exportToCSV(data?.categories || [])}
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