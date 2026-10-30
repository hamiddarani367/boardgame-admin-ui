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
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  FileText,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { toPersianDateTime } from "@/lib/date";

// ==================== تایپ‌ها ====================
interface ContentCategory {
  id: number;
  name: string;
  slug: string;
}

interface ContentTag {
  id: number;
  name: string;
  slug: string;
}

interface Content {
  id: number;
  title: string;
  slug: string;
  type?: string;
  excerpt?: string;
  image?: string;
  status: "draft" | "published";
  enabled?: boolean;
  featured?: boolean;
  category_id?: number | null;
  category?: ContentCategory;
  tags?: ContentTag[];
  published_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface ContentsResponse {
  contents: Content[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface CategoriesResponse {
  categories: ContentCategory[];
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
  if (typeof value === "object") return null;
  return String(value);
}

function deserializeFilters(searchParams: URLSearchParams): Filters {
  const filters: Filters = {};
  searchParams.forEach((value, key) => {
    if (["page", "limit", "sortBy", "sortOrder"].includes(key)) return;
    if (value.includes(",")) {
      filters[key] = value.split(",");
    } else {
      filters[key] = value;
    }
  });
  return filters;
}

// ==================== کامپوننت ====================
export default function ContentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = searchParams.get("sortBy") || "id";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "desc";

  const initialFilters = deserializeFilters(searchParams);

  const [sort, setSort] = useState<SortState>({
    key: initialSortBy,
    order: initialSortOrder,
  });
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // ==================== کوئری اصلی ====================
  const { data, isLoading } = useApiQuery<ContentsResponse>(
    "/admin/contents",
    ["contents"],
    {
      page,
      limit,
      sortBy: sort.key,
      sortOrder: sort.order,
      ...filters,
    }
  );

  // ==================== دسته‌بندی‌ها (فقط برای فیلتر) ====================
  const { data: categoriesData } = useApiQuery<CategoriesResponse>(
    "/admin/content-categories",
    ["content-categories-for-filter"],
    { limit: 200 }
  );

  // ==================== sync URL ====================
  const updateURL = useCallback(
    (p: number, l: number, s: SortState, f: Filters) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", String(p));
      if (l !== 10) params.set("limit", String(l));
      if (s.key !== "id" || s.order !== "desc") {
        params.set("sortBy", s.key);
        params.set("sortOrder", s.order);
      }
      Object.entries(f).forEach(([key, value]) => {
        const serialized = serializeFilterValue(value);
        if (serialized !== null) params.set(key, serialized);
      });
      const qs = params.toString();
      router.replace(`/content${qs ? `?${qs}` : ""}`, { scroll: false });
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

  // ==================== حذف ====================
  const handleDelete = async (id: number, title: string) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      html: `محتوای <b>«${title}»</b> حذف خواهد شد!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/contents/${id}`);
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      toast.success("محتوا با موفقیت حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در حذف محتوا");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  // ==================== تغییر وضعیت انتشار ====================
  const handleTogglePublish = async (content: Content) => {
    try {
      await apiClient.patch(`/admin/contents/${content.id}/publish`);
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      toast.success(
        content.status === "published"
          ? "محتوا از حالت انتشار خارج شد"
          : "محتوا منتشر شد"
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        const data = error.response?.data as { error?: string } | undefined;
        toast.error(data?.error || "خطا در تغییر وضعیت انتشار");
      } else {
        toast.error("خطا در ارتباط با سرور");
      }
    }
  };

  // ==================== ستون‌ها ====================
  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    {
      key: "title",
      title: "عنوان",
      sortable: true,
      render: (content: Content) => (
        <div className="flex items-center gap-3">
          {content.image ? (
            <img
              src={content.image}
              alt={content.title}
              className="w-10 h-10 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="font-medium text-sm truncate">
              {content.title}
            </span>
            <span className="text-xs text-gray-400 truncate" dir="ltr">
              {content.slug}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      title: "دسته‌بندی",
      sortable: false,
      render: (content: Content) => (
        <span className="text-sm">{content.category?.name ?? "—"}</span>
      ),
    },
    {
      key: "status",
      title: "وضعیت",
      sortable: true,
      render: (content: Content) => (
        <Badge
          className={
            content.status === "published"
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }
        >
          {content.status === "published" ? "منتشرشده" : "پیش‌نویس"}
        </Badge>
      ),
    },
    {
      key: "featured",
      title: "ویژه",
      sortable: true,
      render: (content: Content) =>
        content.featured ? (
          <Badge className="bg-purple-100 text-purple-700">ویژه</Badge>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        ),
    },
    {
      key: "updated_at",
      title: "آخرین ویرایش",
      sortable: true,
      render: (content: Content) => (
        <span className="text-xs">
          {toPersianDateTime(content.updated_at)}
        </span>
      ),
    },
  ];

  // ==================== اکشن‌ها ====================
  const renderActions = (content: Content) => (
    <div className="flex justify-center gap-1">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/content/${content.id}`)}
        title="مشاهده"
      >
        <Eye className="h-4 w-4" />
      </AppButton>

      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => router.push(`/content/${content.id}/edit`)}
        title="ویرایش"
      >
        <Pencil className="h-4 w-4" />
      </AppButton>

      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleTogglePublish(content)}
        title={content.status === "published" ? "لغو انتشار" : "انتشار"}
      >
        {content.status === "published" ? (
          <XCircle className="h-4 w-4 text-yellow-600" />
        ) : (
          <CheckCircle className="h-4 w-4 text-green-600" />
        )}
      </AppButton>

      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(content.id, content.title)}
        title="حذف"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  // ==================== فیلترها ====================
  const filterFields: FilterField[] = useMemo(
    () => [
      { name: "id", label: "شناسه", type: "text" },
      { name: "title", label: "عنوان", type: "text" },
      {
        name: "type",
        label: "نوع محتوا",
        type: "select",
        options: [
          { value: "article", label: "مقاله" },
          { value: "page", label: "صفحه" },
          { value: "news", label: "خبر" },
          { value: "guide", label: "راهنما" },
          { value: "faq", label: "سوالات متداول" },
        ],
        valueKey: "value",
        labelKey: "label",
      },
      {
        name: "status",
        label: "وضعیت",
        type: "select",
        options: [
          { value: "published", label: "منتشرشده" },
          { value: "draft", label: "پیش‌نویس" },
        ],
        valueKey: "value",
        labelKey: "label",
      },
      {
        name: "category_id",
        label: "دسته‌بندی",
        type: "select",
        options:
          categoriesData?.categories.map((c) => ({
            value: String(c.id),
            label: c.name,
          })) ?? [],
        valueKey: "value",
        labelKey: "label",
      },
      {
        name: "enabled",
        label: "فعال",
        type: "select",
        options: [
          { value: "true", label: "فعال" },
          { value: "false", label: "غیرفعال" },
        ],
        valueKey: "value",
        labelKey: "label",
      },
      {
        name: "featured",
        label: "ویژه",
        type: "select",
        options: [
          { value: "true", label: "ویژه" },
          { value: "false", label: "عادی" },
        ],
        valueKey: "value",
        labelKey: "label",
      },
      {
        name: "created_at",
        label: "بازه تاریخ ایجاد",
        type: "date-time-range",
        colSpan: 2,
      },
    ],
    [categoriesData]
  );

  // ==================== رندر ====================
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">مدیریت محتوا</h1>

      <FilterBar
        fields={filterFields}
        onFilter={handleFilter}
        initialValues={filters}
      />

      <DataTable
        columns={columns}
        data={data?.contents || []}
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
              onClick={() => router.push("/content/create")}
            >
              <Plus className="h-4 w-4" />
              محتوای جدید
            </AppButton>
          </>
        }
      />
    </div>
  );
}