"use client";

import { useState, useEffect, useCallback } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { DataTable } from "@/components/shared/DataTable";
import { FilterBar, type FilterField } from "@/components/shared/FilterBar";
import { AppButton } from "@/components/shared/AppButton";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Mail, MailOpen } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toPersianDigits } from "@/lib/format";
import Swal from "sweetalert2";
import { toast } from "sonner";

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // state ها
  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "created_at";
  const initialSortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const initialFilters: Record<string, any> = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    initialFilters[key] = value;
  });

  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState(initialFilters);

  const { data, isLoading } = useApiQuery<{ messages: any[]; total: number }>(
    "/messages",
    ["messages"],
    { page, limit, sortBy: sort.key, sortOrder: sort.order, ...filters }
  );

  const updateURL = useCallback(
    (p: number, l: number, s: { key: string; order: "asc" | "desc" }, f: Record<string, any>) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "created_at" || s.order !== "desc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) params.set(key, String(value));
      });
      router.replace(`/messages${params.toString() ? `?${params.toString()}` : ""}`, {
        scroll: false,
      });
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
      text: "این پیام حذف خواهد شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      const { apiClient } = await import("@/hooks/useApi");
      await apiClient.delete(`/messages/${id}`);
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      await queryClient.refetchQueries({ queryKey: ["messages"] });
      toast.success("پیام حذف شد");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در حذف پیام");
    }
  };

  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    { key: "sender_name", title: "فرستنده", sortable: true },
    { key: "subject", title: "موضوع", sortable: true },
    {
      key: "message",
      title: "متن پیام",
      sortable: false,
      render: (msg: any) => (
        <span className="line-clamp-1 max-w-xs">{msg.message}</span>
      ),
    },
    {
      key: "is_read",
      title: "وضعیت",
      sortable: true,
      render: (msg: any) => (
        <Badge className={msg.is_read ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-700"}>
          {msg.is_read ? "خوانده شده" : "خوانده نشده"}
        </Badge>
      ),
    },
    {
      key: "created_at",
      title: "تاریخ",
      sortable: true,
      render: (msg: any) => toPersianDigits(msg.created_at),
    },
  ];

  const renderActions = (msg: any) => (
    <div className="flex justify-center gap-2">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/messages/${msg.id}`)}
      >
        {msg.is_read ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
      </AppButton>
      <AppButton variant="ghost" size="icon" onClick={() => handleDelete(msg.id)}>
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const filterFields: FilterField[] = [
    { name: "sender_name", label: "فرستنده", type: "text" },
    { name: "subject", label: "موضوع", type: "text" },
    {
      name: "is_read",
      label: "وضعیت",
      type: "select",
      options: [
        { id: "true", title: "خوانده شده" },
        { id: "false", title: "خوانده نشده" },
      ],
      valueKey: "id",
      labelKey: "title",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">پیام‌ها</h1>

      <FilterBar fields={filterFields} onFilter={handleFilter} initialValues={filters} />

      <DataTable
        columns={columns}
        data={data?.messages || []}
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
      />
    </div>
  );
}