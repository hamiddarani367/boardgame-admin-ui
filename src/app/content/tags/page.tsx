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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag as TagIcon } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { toPersianDateTime } from "@/lib/date";

// ==================== تایپ‌ها ====================
interface ContentTag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at?: string;
}

// ==================== schema ====================
const tagSchema = z.object({
  name: z
    .string()
    .min(2, "نام حداقل ۲ حرف")
    .max(100, "حداکثر ۱۰۰ حرف"),
  slug: z
    .string()
    .min(2, "Slug حداقل ۲ حرف")
    .max(100, "حداکثر ۱۰۰ حرف")
    .regex(
      /^[a-z0-9-]+$/,
      "فقط حروف کوچک انگلیسی، اعداد و خط تیره"
    ),
});

type TagFormValues = z.infer<typeof tagSchema>;

const EMPTY_FORM: TagFormValues = { name: "", slug: "" };

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
export default function ContentTagsPage() {
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContentTag | null>(null);

  // ✅ پاسخ API یه آرایه‌ست، نه آبجکت با کلید tags
  const { data, isLoading } = useApiQuery<ContentTag[]>(
    "/admin/content-tags",
    ["content-tags"]
  );

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: EMPTY_FORM,
  });

  // ==================== Mutation ====================
  const createMutation = useApiMutation<ContentTag, TagFormValues>(
    "/admin/content-tags",
    "POST",
    ["content-tags"]
  );

  const updateMutation = useApiMutation<ContentTag, TagFormValues>(
    editing ? `/admin/content-tags/${editing.id}` : "",
    "PUT",
    ["content-tags"]
  );

  // ==================== باز کردن دیالوگ ====================
  const openCreate = () => {
    setEditing(null);
    reset(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (tag: ContentTag) => {
    setEditing(tag);
    reset({ name: tag.name, slug: tag.slug });
    setDialogOpen(true);
  };

  // ==================== ذخیره ====================
  const onSubmitForm = async (formData: TagFormValues) => {
    try {
      if (editing) {
        await updateMutation.mutateAsync(formData);
        toast.success("تگ ویرایش شد");
      } else {
        await createMutation.mutateAsync(formData);
        toast.success("تگ ایجاد شد");
      }
      queryClient.invalidateQueries({ queryKey: ["content-tags"] });
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در ذخیره تگ");
      } else {
        toast.error("خطا در ذخیره تگ");
      }
    }
  };

  // ==================== حذف ====================
  const handleDelete = async (tag: ContentTag) => {
    const result = await Swal.fire({
      title: "آیا مطمئن هستید؟",
      html: `تگ <b>«${tag.name}»</b> حذف خواهد شد!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "بله، حذف کن",
      cancelButtonText: "انصراف",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/admin/content-tags/${tag.id}`);
      queryClient.invalidateQueries({ queryKey: ["content-tags"] });
      toast.success("تگ حذف شد");
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در حذف تگ");
      } else {
        toast.error("خطا در حذف تگ");
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
      render: (tag: ContentTag) => (
        <div className="flex items-center gap-2">
          <TagIcon className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-sm">{tag.name}</span>
        </div>
      ),
    },
    {
      key: "slug",
      title: "Slug",
      sortable: true,
      render: (tag: ContentTag) => (
        <span dir="ltr" className="text-xs font-mono text-gray-500">
          {tag.slug}
        </span>
      ),
    },
    {
      key: "created_at",
      title: "تاریخ ایجاد",
      sortable: true,
      render: (tag: ContentTag) => (
        <span className="text-xs">{toPersianDateTime(tag.created_at)}</span>
      ),
    },
  ];

  // ==================== اکشن‌ها ====================
  const renderActions = (tag: ContentTag) => (
    <div className="flex justify-center gap-1">
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => openEdit(tag)}
        title="ویرایش"
      >
        <Pencil className="h-4 w-4" />
      </AppButton>
      <AppButton
        variant="ghost"
        size="icon"
        onClick={() => handleDelete(tag)}
        title="حذف"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </AppButton>
    </div>
  );

  // ✅ data خودش آرایه‌ست
  const tags = data ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تگ‌های محتوا</h1>

      <DataTable
        columns={columns}
        data={tags}
        totalCount={tags.length}
        pageSize={300}
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
            تگ جدید
          </AppButton>
        }
      />

      {/* ==================== دیالوگ ==================== */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? "ویرایش تگ" : "تگ جدید"}
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
                    placeholder="نام تگ"
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
                    placeholder="tag-slug"
                    dir="ltr"
                  />
                )}
              />
              {errors.slug && (
                <p className="text-xs text-red-500">{errors.slug.message}</p>
              )}
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
                {editing ? "ذخیره تغییرات" : "ایجاد تگ"}
              </AppButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}