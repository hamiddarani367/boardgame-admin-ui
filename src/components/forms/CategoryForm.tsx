"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/useApi";

// ==================== تایپ‌ها ====================
interface Attribute {
  id: number;
  name: string;
}

interface CategoryFormProps {
  initialData?: {
    id?: number;
    name: string;
    icon?: string;
    color?: string;
    light_bg?: string;
    light_text?: string;
    attribute_ids: number[];
  };
  isEdit?: boolean;
  onSubmit: (data: {
    name: string;
    icon: string | null;
    color: string | null;
    light_bg: string | null;
    light_text: string | null;
    attribute_ids: number[];
  }) => Promise<void> | void;
}

// ==================== schema ====================
const categoryFormSchema = z.object({
  name: z.string().min(2, "نام دسته‌بندی حداقل ۲ حرف").max(150, "حداکثر ۱۵۰ حرف"),
  icon: z.string().max(500, "حداکثر ۵۰۰ حرف").optional().or(z.literal("")),
  color: z.string().max(100, "حداکثر ۱۰۰ حرف").optional().or(z.literal("")),
  light_bg: z.string().max(100, "حداکثر ۱۰۰ حرف").optional().or(z.literal("")),
  light_text: z.string().max(100, "حداکثر ۱۰۰ حرف").optional().or(z.literal("")),
  attribute_ids: z.array(z.number()).min(0),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function CategoryForm({
  initialData,
  isEdit = false,
  onSubmit,
}: CategoryFormProps) {
  const router = useRouter();

  const { data: attributesData, isLoading: attributesLoading } =
    useApiQuery<Attribute[]>("/admin/attributes/all", ["attributes-list"]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      icon: "",
      color: "",
      light_bg: "",
      light_text: "",
      attribute_ids: [],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        icon: initialData.icon || "",
        color: initialData.color || "",
        light_bg: initialData.light_bg || "",
        light_text: initialData.light_text || "",
        attribute_ids: initialData.attribute_ids || [],
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = async (data: CategoryFormValues) => {
    const payload = {
      name: data.name,
      icon: data.icon || null,
      color: data.color || null,
      light_bg: data.light_bg || null,
      light_text: data.light_text || null,
      attribute_ids: data.attribute_ids,
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش دسته‌بندی" : "ایجاد دسته‌بندی"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نام */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="مثلاً استراتژیک"
                  />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* آیکون */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">آیکون (ایموجی یا URL)</label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="♟️ یا https://..."
                    dir="ltr"
                  />
                )}
              />
              {errors.icon && <p className="text-xs text-red-500">{errors.icon.message}</p>}
            </div>

            {/* رنگ hover (کلاس Tailwind) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کلاس hover (مثلاً hover:bg-red-50)</label>
              <Controller
                name="color"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="hover:bg-red-50 dark:hover:bg-red-950"
                    dir="ltr"
                  />
                )}
              />
              {errors.color && <p className="text-xs text-red-500">{errors.color.message}</p>}
            </div>

            {/* پس‌زمینه روشن */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کلاس پس‌زمینه روشن</label>
              <Controller
                name="light_bg"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="bg-red-50 dark:bg-red-950"
                    dir="ltr"
                  />
                )}
              />
              {errors.light_bg && (
                <p className="text-xs text-red-500">{errors.light_bg.message}</p>
              )}
            </div>

            {/* متن روشن */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کلاس متن روشن</label>
              <Controller
                name="light_text"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="text-red-600 dark:text-red-400"
                    dir="ltr"
                  />
                )}
              />
              {errors.light_text && (
                <p className="text-xs text-red-500">{errors.light_text.message}</p>
              )}
            </div>

            {/* ویژگی‌ها */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">ویژگی‌ها</label>
              <Controller
                name="attribute_ids"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={attributesData || []}
                    value={field.value.map(String)}
                    onChange={(val) => {
                      const selected = Array.isArray(val) ? val : [];
                      field.onChange(selected.map(Number));
                    }}
                    isMulti
                    placeholder="انتخاب ویژگی‌ها"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
              {attributesLoading && (
                <p className="text-xs text-muted-foreground">در حال بارگذاری ویژگی‌ها...</p>
              )}
              {errors.attribute_ids && (
                <p className="text-xs text-red-500">{errors.attribute_ids.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}