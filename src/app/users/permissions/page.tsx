"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useApiQuery } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";

// تایپ دقیق Permission بر اساس backend
interface Permission {
  id: number;
  name: string;
}

interface PermissionsResponse {
  permissions: Permission[];
  total: number;
}

interface SortState {
  key: string;
  order: "asc" | "desc";
}

export default function PermissionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // خواندن مقادیر اولیه از URL
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sort, setSort] = useState<SortState>({
    key: initialSortBy,
    order: initialSortOrder,
  });

  // دریافت داده‌ها با پارامترهای صفحه‌بندی و مرتب‌سازی
  const { data, isLoading } = useApiQuery<PermissionsResponse>(
    "/admin/permissions",
    ["permissions"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
    }
  );

  // به‌روزرسانی URL هنگام تغییر پارامترها
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
      router.replace(`/users/permissions${qs ? `?${qs}` : ""}`, {
        scroll: false,
      });
    },
    [router]
  );

  useEffect(() => {
    updateURL(page, limit, sort);
  }, [page, limit, sort, updateURL]);

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "name", title: "دسترسی", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <DataTable
        columns={columns}
        data={data?.permissions || []}
        totalCount={data?.total || 0}
        pageSize={limit}
        currentPage={page}
        onPageChange={setPage}
        onPageSizeChange={(size) => {
          setLimit(size);
          setPage(1); // با تغییر تعداد، به صفحه اول برگرد
        }}
        onSort={(key, order) => {
          setSort({ key, order });
          setPage(1); // با تغییر مرتب‌سازی، به صفحه اول برگرد
        }}
        sortKey={sort.key}
        sortOrder={sort.order}
        isLoading={isLoading}
      />
    </div>
  );
}