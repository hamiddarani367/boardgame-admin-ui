"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { AppButton } from "@/components/shared/AppButton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌ها ====================
export interface Role {
  id: number;
  name: string;
}

interface RolesResponse {
  roles: Role[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

// ==================== کامپوننت ====================
export default function RolesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // خواندن پارامترها از URL
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "name";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState<SortState>({
    key: initialSortBy,
    order: initialSortOrder,
  });

  // دریافت داده‌ها
  const { data, isLoading } = useApiQuery<RolesResponse>(
    "/admin/roles",
    ["roles"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
    }
  );

  // به‌روزرسانی URL فقط با پارامترهای غیر پیش‌فرض
  const updateURL = useCallback(
    (p: number, l: number, s: SortState) => {
      const params = new URLSearchParams();

      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "name" || s.order !== "asc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }

      const qs = params.toString();
      router.replace(`/users/roles${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    updateURL(page, limit, sort);
  }, [page, limit, sort, updateURL]);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      text: "این نقش حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      // ✅ مسیر هماهنگ با useApiQuery
      await apiClient.delete(`/admin/roles/${id}`);
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
      toast.success("نقش با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در حذف نقش");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "نام نقش", sortable: true },
  ];

  const renderActions = (role: Role) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/users/roles/${role.id}/edit`)}
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(role.id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ✅ عنوان صفحه */}
      <h1 className="text-2xl font-bold">نقش‌ها</h1>

      <DataTable
        columns={columns}
        data={data?.roles || []}
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
              onClick={() => router.push("/users/roles/create")}
            >
              <Plus className="h-4 w-4" />
              ایجاد نقش
            </AppButton>
          </>
        }
      />
    </div>
  );
}