"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { useAttributes } from "@/hooks/useAttributes";
import { Loader2 } from "lucide-react";

// تعریف schema
const categoryFormSchema = z.object({
  title: z.string().min(2, "عنوان دسته‌بندی حداقل ۲ حرف"),
  description: z.string(),
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
  attributes: z.array(z.string()).min(1, "حداقل یک ویژگی انتخاب کنید"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  initialData?: any; // برای ویرایش
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

const statusOptions: Option[] = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

export function CategoryForm({ initialData, isEdit = false, onSubmit }: CategoryFormProps) {
  const router = useRouter();
  const { data: attributes, isLoading: attributesLoading } = useAttributes(); // دریافت لیست ویژگی‌ها

  // تبدیل ویژگی‌ها به Option برای SelectInput
  const attributeOptions: Option[] =
    attributes?.map((attr: any) => ({
      value: String(attr.id),
      label: attr.title,
      ...attr,
    })) || [];

  const initialAttributes: string[] = initialData?.attributes
    ? initialData.attributes.map((attr: any) => String(attr.id))
    : [];

  const initialStatus = initialData?.is_active ? "active" : "inactive";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      status: initialStatus,
      attributes: initialAttributes,
    },
  });

  const onSubmitForm = async (data: any) => {
    const payload = {
      title: data.title,
      description: data.description,
      is_active: data.status === "active",
      attribute_ids: data.attributes.map(Number), // تبدیل به آرایه عددی
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* عنوان */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">عنوان *</label>
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <AppInput value={field.value} onChange={field.onChange} placeholder="مثلاً بازی فکری" />
            )}
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* وضعیت */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">وضعیت *</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <SelectInput
                options={statusOptions}
                value={field.value}
                onChange={(val) => {
                  const option = val as Option | null;
                  field.onChange(option ? option.value : "");
                }}
                placeholder="انتخاب وضعیت"
                className="w-full"
              />
            )}
          />
          {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
        </div>

        {/* ویژگی‌ها (چندانتخابی) */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium">ویژگی‌ها *</label>
          <Controller
            name="attributes"
            control={control}
            render={({ field }) => (
              <SelectInput
                options={attributeOptions}
                value={field.value}
                onChange={(val) => {
                  const selectedIds = Array.isArray(val)
                    ? val.map((opt: any) => String(opt.value))
                    : [];
                  field.onChange(selectedIds);
                }}
                isMulti
                placeholder="انتخاب ویژگی‌ها"
                className="w-full"
                valueKey="id"
                labelKey="title"
              />
            )}
          />
          {attributesLoading && (
            <p className="text-xs text-muted-foreground">در حال بارگذاری ویژگی‌ها...</p>
          )}
          {errors.attributes && (
            <p className="text-xs text-red-500">{errors.attributes.message}</p>
          )}
        </div>

        {/* توضیحات */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <label className="text-sm font-medium">توضیحات</label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                value={field.value}
                onChange={field.onChange}
                placeholder="توضیحات دسته‌بندی"
                rows={4}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="soft-red" onClick={() => router.back()}>
          انصراف
        </AppButton>
        <AppButton type="submit" variant="soft-blue" loading={isSubmitting}>
          {isEdit ? "ذخیره تغییرات" : "ایجاد دسته‌بندی"}
        </AppButton>
      </div>
    </form>
  );
}