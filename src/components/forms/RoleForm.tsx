"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionSelector } from "@/components/shared/PermissionSelector";

const roleFormSchema = z.object({
  name: z.string().min(2, "نام نقش حداقل ۲ حرف"),
  permissions: z.array(z.number()).min(1, "حداقل یک دسترسی انتخاب کنید"),
});

type RoleFormValues = z.infer<typeof roleFormSchema>;

interface RoleFormProps {
  initialData?: {
    id?: number;
    name: string;
    permissions: number[]; // شناسه‌ها
  };
  isEdit?: boolean;
  onSubmit: (data: { name: string; permission_ids: number[] }) => Promise<void> | void;
}

export function RoleForm({ initialData, isEdit = false, onSubmit }: RoleFormProps) {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  // به‌روزرسانی فرم با داده‌های اولیه
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        permissions: initialData.permissions || [],
      });
    }
  }, [initialData, reset]);

  const onSubmitForm = async (data: RoleFormValues) => {
    await onSubmit({
      name: data.name,
      permission_ids: data.permissions, // تبدیل برای API
    });
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="flex flex-col gap-2 ">
            <label className="text-sm font-medium">نام نقش *</label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <AppInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="مثلاً ویرایشگر"
                />
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">دسترسی‌ها *</label>
            <Controller
              name="permissions"
              control={control}
              render={({ field }) => (
                <PermissionSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.permissions && (
              <p className="text-xs text-red-500">{errors.permissions.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد نقش"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}