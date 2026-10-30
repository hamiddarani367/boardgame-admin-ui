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

interface BrandFormProps {
  initialData?: {
    id?: number;
    name: string;
    description?: string;
    enabled?: boolean;
  };
  isEdit?: boolean;
  onSubmit: (data: {
    name: string;
    description: string | null;
    enabled: boolean;
  }) => Promise<void> | void;
}

const brandFormSchema = z.object({
  name: z.string().min(2, "نام برند حداقل ۲ حرف").max(150, "حداکثر ۱۵۰ حرف"),
  description: z.string().optional().or(z.literal("")),
  enabled: z.string().min(1, "وضعیت را انتخاب کنید"),
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

export function BrandForm({ initialData, isEdit = false, onSubmit }: BrandFormProps) {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      description: "",
      enabled: "true",
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        description: initialData.description || "",
        enabled: initialData.enabled ? "true" : "false",
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = async (data: BrandFormValues) => {
    await onSubmit({
      name: data.name,
      description: data.description || null,
      enabled: data.enabled === "true",
    });
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش برند" : "ایجاد برند"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نام برند */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام برند *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="مثلاً Mipples" />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* وضعیت */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">وضعیت *</label>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={[
                      { value: "true", label: "فعال" },
                      { value: "false", label: "غیرفعال" },
                    ]}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب وضعیت"
                    className="w-full"
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              />
              {errors.enabled && <p className="text-xs text-red-500">{errors.enabled.message}</p>}
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
                    placeholder="توضیحات برند (اختیاری)"
                    rows={4}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد برند"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}