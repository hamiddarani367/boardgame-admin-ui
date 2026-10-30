"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, Plus, Download } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌ها ====================
interface Attribute {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

interface AttributesResponse {
  attributes: Attribute[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

// ==================== خروجی CSV ====================
const exportToCSV = (attributes: Attribute[]) => {
  if (!attributes.length) return;
  const headers = ["شناسه", "نام", "اسلاگ", "وضعیت"];
  const rows = attributes.map((a) => [a.id, a.name, a.slug, a.enabled ? "فعال" : "غیرفعال"]);
  const csv =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csv));
  link.setAttribute("download", "attributes.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function AttributesPage() {
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

  const { data, isLoading } = useApiQuery<AttributesResponse>(
    "/admin/attributes",
    ["attributes"],
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
      router.replace(`/products/attributes${qs ? `?${qs}` : ""}`, {
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
      text: "این ویژگی حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/attributes/${id}`);
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
      await queryClient.refetchQueries({ queryKey: ["attributes"] });
      toast.success("ویژگی با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف ویژگی");
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
      key: "enabled",
      title: "وضعیت",
      sortable: true,
      render: (attr: Attribute) => (
        <Badge
          className={
            attr.enabled
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }
        >
          {attr.enabled ? "فعال" : "غیرفعال"}
        </Badge>
      ),
    },
  ];

  const renderActions = (attr: Attribute) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/products/attributes/${attr.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(attr.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={data?.attributes || []}
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
              onClick={() => router.push("/products/attributes/create")}
            >
              <Plus className="h-4 w-4" />
              ویژگی جدید
            </AppButton>
            <AppButton
              variant="green"
              onClick={() => exportToCSV(data?.attributes || [])}
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