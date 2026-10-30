"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useApiQuery, useApiMutation, apiClient } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { DataTable } from "@/components/shared/DataTable";
import { AppButton } from "@/components/shared/AppButton";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput } from "@/components/shared/SelectInput";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { toPersianDateTime } from "@/lib/date";

// ==================== تایپ‌ها ====================
interface ContentCategory {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  parent?: ContentCategory | null;
  children?: ContentCategory[];
  created_at: string;
  updated_at: string;
}

interface CategoriesResponse {
  categories: ContentCategory[];
  total: number;
}

// ==================== schema ====================
const categorySchema = z.object({
  name: z
    .string()
    .min(2, "نام حداقل ۲ حرف")
    .max(150, "حداکثر ۱۵۰ حرف"),
  slug: z
    .string()
    .min(2, "Slug حداقل ۲ حرف")
    .max(150, "حداکثر ۱۵۰ حرف")
    .regex(
      /^[a-z0-9-]+$/,
      "فقط حروف کوچک انگلیسی، اعداد و خط تیره"
    ),
  parent_id: z.number().nullable(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const EMPTY_FORM: CategoryFormValues = {
  name: "",
  slug: "",
  parent_id: null,
};

function generateSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ==================== کامپوننت ====================
export default function ContentCategoriesPage() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentCategory | null>(null);

  const { data, isLoading } = useApiQuery<CategoriesResponse>(
    "/admin/content-categories",
    ["content-categories"],
    { limit: 200 }
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: EMPTY_FORM,
  });

  // ==================== Mutation ====================
  const createMutation = useApiMutation<ContentCategory, CategoryFormValues>(
    "/admin/content-categories",
    "POST",
    ["content-categories"]
  );

  const updateMutation = useApiMutation<ContentCategory, CategoryFormValues>(
    editing ? `/admin/content-categories/${editing.id}` : "",
    "PUT",
    ["content-categories"]
  );

  // ==================== باز کردن دیالوگ ====================
  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (cat: ContentCategory) => {
    setEditing(cat);
    reset({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id ?? null,
    });
    setDialogOpen(true);
  };

  // ==================== ذخیره ====================
  const onSubmitForm = async (formData: CategoryFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync(formData);
        toast.success("دسته‌بندی ویرایش شد");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("دسته‌بندی ایجاد شد");
      }
      queryClient.invalidateQueries({ queryKey: ["content-categories"] });
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در ذخیره دسته‌بندی");
      } else {
        toast.error("خطا در ذخیره دسته‌بندی");
      }
    }
  };

  // ==================== حذف ====================
  const handleDelete = async (cat: ContentCategory) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      html: `دسته‌بندی <b>«${cat.name}»</b> حذف خواهد شد!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/content-categories/${cat.id}`);
      queryClient.invalidateQueries({ queryKey: ["content-categories"] });
      toast.success("دسته‌بندی حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در حذف دسته‌بندی");
      } else {
        toast.error("خطا در حذف دسته‌بندی");
      }
    }
  };

  // ==================== ستون‌ها ====================
  const columns = [
    { key: "id", title: "شناسه", sortable: true },
    {
      key: "name",
      title: "نام",
      sortable: true,
      render: (cat: ContentCategory) => (
        <div className="flex items-center gap-2">
          <FolderTree className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-sm">{cat.name}</span>
        </div>
      ),
    },
    {
      key: "slug",
      title: "Slug",
      sortable: true,
      render: (cat: ContentCategory) => (
        <span dir="ltr" className="text-xs font-mono text-gray-500">
          {cat.slug}
        </span>
      ),
    },
    {
      key: "parent",
      title: "والد",
      sortable: false,
      render: (cat: ContentCategory) => (
        <span className="text-sm">{cat.parent?.name ?? "—"}</span>
      ),
    },
    {
      key: "updated_at",
      title: "آخرین ویرایش",
      sortable: true,
      render: (cat: ContentCategory) => (
        <span className="text-xs">{toPersianDateTime(cat.updated_at)}</span>
      ),
    },
  ];

  // ==================== اکشن‌ها ====================
  const renderActions = (cat: ContentCategory) => (
    <div className="flex justify-center gap-1">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => openEdit(cat)}
        title="ویرایش"
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(cat)}
        title="حذف"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  const categories = data?.categories ?? [];

  // ==================== گزینه‌های والد (بدون خود دسته‌بندی) ====================
  const parentOptions = [
    { id: 0, name: "بدون والد" },
    ...categories
      .filter((c) => c.id !== editing?.id)
      .map((c) => ({ id: c.id, name: c.name })),
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">دسته‌بندی‌های محتوا</h1>

      <DataTable
        columns={columns}
        data={categories}
        totalCount={data?.total ?? categories.length}
        pageSize={200}
        currentPage={1}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onSort={() => {}}
        sortKey="id"
        sortOrder="desc"
        isLoading={isLoading}
        actions={renderActions}
        toolbarActions={
          <AppButton variant="blue" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            دسته‌بندی جدید
          </AppButton>
        }
      />

      {/* ==================== دیالوگ ==================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmitForm)}
            className="space-y-5 pt-2"
          >
            {/* نام */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                نام <span className="text-red-500">*</span>
              </label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={(e) => {
                      const v = e.target.value;
                      field.onChange(v);
                      if (!editing) {
                        setValue("slug", generateSlug(v));
                      }
                    }}
                    placeholder="نام دسته‌بندی"
                  />
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Slug */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                Slug <span className="text-red-500">*</span>
              </label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    placeholder="category-slug"
                    dir="ltr"
                  />
                )}
              />
              {errors.slug && (
                <p className="text-xs text-red-500">{errors.slug.message}</p>
              )}
            </div>

            {/* والد */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">دسته‌بندی والد</label>
              <Controller
                name="parent_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={parentOptions}
                    value={field.value ? String(field.value) : "0"}
                    onChange={(v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      const num = val ? Number(val) : 0;
                      field.onChange(num === 0 ? null : num);
                    }}
                    placeholder="انتخاب والد"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
            </div>

            {/* دکمه‌ها */}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <AppButton
                type="button"
                variant="red"
                onClick={() => setDialogOpen(false)}
              >
                انصراف
              </AppButton>
              <AppButton
                type="submit"
                variant="blue"
                loading={isSubmitting}
              >
                {editing ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
              </AppButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}