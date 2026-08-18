"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { Loader2 } from "lucide-react";

interface Permission {
  id: string;
  title: string;
}

interface PermissionsResponse {
  permissions: Permission[];
  total: number;
}

export default function PermissionsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: "id",
    order: "asc",
  });

  const { data, isLoading } = useApiQuery<PermissionsResponse>(
    "/permissions",
    ["permissions"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order }
  );

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "title", title: "دسترسی", sortable: true },
  ];

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">دسترسی‌ها</h1>

      <DataTable
        columns={columns}
        data={data?.permissions || []}
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
      />
    </div>
  );
}