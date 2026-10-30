"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BooleanSelect } from "../shared/BooleanSelect";

// ==================== تایپ‌ها ====================
interface AttributeFormProps {
  initialData?: {
    id?: number;
    name: string;
    slug?: string;
    description?: string;
    icon?: string;
    unit?: string;
    enabled?: boolean;
  };
  isEdit?: boolean;
  onSubmit: (data: {
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    unit: string | null;
    enabled: boolean;
  }) => Promise<void> | void;
}

// ==================== schema ====================
const attributeFormSchema = z.object({
  name: z
    .string()
    .min(2, "نام ویژگی حداقل ۲ حرف")
    .max(150, "حداکثر ۱۵۰ حرف"),
  slug: z
    .string()
    .min(2, "اسلاگ حداقل ۲ حرف")
    .max(150, "حداکثر ۱۵۰ حرف")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "اسلاگ فقط می‌تواند شامل حروف کوچک انگلیسی، عدد و خط تیره باشد"
    ),
  description: z
    .string()
    .max(1000, "حداکثر ۱۰۰۰ حرف")
    .optional()
    .or(z.literal("")),
  icon: z.string().max(500, "حداکثر ۵۰۰ حرف").optional().or(z.literal("")),
  unit: z.string().max(50, "حداکثر ۵۰ حرف").optional().or(z.literal("")),
  enabled: z.boolean(),
});

type AttributeFormValues = z.infer<typeof attributeFormSchema>;

// ==================== helpers ====================
/**
 * تبدیل نام فارسی/انگلیسی به اسلاگ معتبر
 * مثال: "تعداد بازیکن" → "players" (چون فارسی قابل تبدیل نیست، خالی می‌مونه)
 *       "Player Count" → "player-count"
 */
function generateSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AttributeForm({
  initialData,
  isEdit = false,
  onSubmit,
}: AttributeFormProps) {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      icon: "",
      unit: "",
      enabled: true,
    },
  });

  // پر کردن فرم در حالت ویرایش
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        slug: initialData.slug || "",
        description: initialData.description || "",
        icon: initialData.icon || "",
        unit: initialData.unit || "",
        enabled: initialData.enabled ?? true,
      });
    }
  }, [initialData, reset]);

  // اگر کاربر در حالت Create نام را تایپ کرد و اسلاگ دست‌نخورده بود، خودکار پر کن
  const nameValue = watch("name");
  const slugValue = watch("slug");

  useEffect(() => {
    if (isEdit) return;
    if (!nameValue) return;
    // فقط اگر slug خالی بود یا از قبل auto-generated بود، به‌روز کن
    const autoSlug = generateSlug(nameValue);
    if (!slugValue || slugValue === generateSlug(slugValue)) {
      if (autoSlug) setValue("slug", autoSlug, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameValue, isEdit]);

  const onSubmitForm = async (data: AttributeFormValues) => {
    const payload = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description?.trim() || null,
      icon: data.icon?.trim() || null,
      unit: data.unit?.trim() || null,
      enabled: data.enabled,
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش ویژگی" : "ایجاد ویژگی"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    onChange={field.onChange}
                    placeholder="مثلاً تعداد بازیکن"
                  />
                )}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* اسلاگ */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                اسلاگ <span className="text-red-500">*</span>
              </label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="players"
                    dir="ltr"
                  />
                )}
              />
              {errors.slug && (
                <p className="text-xs text-red-500">{errors.slug.message}</p>
              )}
              <p className="text-[11px] text-gray-500">
                شناسه انگلیسی یکتا؛ فقط حروف کوچک، عدد و خط تیره
              </p>
            </div>

            {/* واحد */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">واحد</label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً نفر، دقیقه، گرم"
                  />
                )}
              />
              {errors.unit && (
                <p className="text-xs text-red-500">{errors.unit.message}</p>
              )}
              <p className="text-[11px] text-gray-500">
                پسوندی که در نمایش مقدار ویژگی کنار آن قرار می‌گیرد
              </p>
            </div>

            {/* آیکون */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">آیکون (URL یا Emoji)</label>
              <Controller
                name="icon"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="https://... یا 👥"
                    dir="ltr"
                  />
                )}
              />
              {errors.icon && (
                <p className="text-xs text-red-500">{errors.icon.message}</p>
              )}
              <p className="text-[11px] text-gray-500">
                می‌توانید یک ایموجی یا آدرس تصویر وارد کنید
              </p>
            </div>

            {/* وضعیت */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                وضعیت <span className="text-red-500">*</span>
              </label>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <BooleanSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="انتخاب وضعیت"
                    className="w-full"
                    trueLabel="فعال"
                    falseLabel="غیرفعال"
                  />
                )}
              />
              {errors.enabled && (
                <p className="text-xs text-red-500">{errors.enabled.message}</p>
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
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="توضیحات ویژگی"
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton
              type="button"
              variant="red"
              onClick={() => router.back()}
            >
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد ویژگی"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}