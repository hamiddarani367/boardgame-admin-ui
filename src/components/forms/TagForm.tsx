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

// تایپ props
interface TagFormProps {
  initialData?: {
    id?: number;
    name: string;
    enabled?: boolean;
  };
  isEdit?: boolean;
  onSubmit: (data: { name: string; enabled: boolean }) => Promise<void> | void;
}

// schema
const tagFormSchema = z.object({
  name: z.string().min(2, "نام تگ حداقل ۲ حرف").max(100, "حداکثر ۱۰۰ حرف"),
  enabled: z.string().min(1, "وضعیت را انتخاب کنید"),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

const statusOptions = [
  { value: "true", label: "فعال" },
  { value: "false", label: "غیرفعال" },
];

export function TagForm({ initialData, isEdit = false, onSubmit }: TagFormProps) {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: "",
      enabled: "true",
    },
  });

  // پر کردن فرم در ویرایش
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        enabled: initialData.enabled ? "true" : "false",
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = async (data: TagFormValues) => {
    await onSubmit({
      name: data.name,
      enabled: data.enabled === "true",
    });
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش تگ" : "ایجاد تگ"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نام تگ */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام تگ *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="مثلاً استراتژیک" />
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
                    options={statusOptions}
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
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد تگ"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}