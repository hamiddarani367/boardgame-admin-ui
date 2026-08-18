"use client";

import { useEffect } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useRoles, Role } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// تعریف schema
const userFormSchema = z.object({
  first_name: z.string().min(2, "نام حداقل ۲ حرف باید داشته باشد"),
  last_name: z.string().min(2, "نام خانوادگی حداقل ۲ حرف باید داشته باشد"),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸)"),
  email: z.string().email("ایمیل معتبر نیست").or(z.literal("")),
  role_ids: z.array(z.number()),
  enabled: z.string().min(1, "وضعیت را انتخاب کنید"),
  image: z.string(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: {
    id?: number;
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
    role_ids?: number[];
    enabled: boolean;
    image?: string;
  };
  isEdit?: boolean;
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    role_ids: number[];
    enabled: boolean;
    image: string | null;
  }) => Promise<void> | void;
}

const statusOptions: Option[] = [
  { value: "true", label: "فعال" },
  { value: "false", label: "غیرفعال" },
];

export function UserForm({ initialData, isEdit = false, onSubmit }: UserFormProps) {
  const router = useRouter();
  const { data: roles, isLoading: rolesLoading } = useRoles();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      role_ids: [],
      enabled: "true",
      image: "",
    },
  });

  // به‌روزرسانی فرم با داده‌های اولیه
  useEffect(() => {
    if (initialData) {
      reset({
        first_name: initialData.first_name || "",
        last_name: initialData.last_name || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        role_ids: initialData.role_ids || [],
        enabled: initialData.enabled ? "true" : "false",
        image: initialData.image || "",
      });
    }
  }, [initialData, reset]);

  const onSubmitForm: SubmitHandler<UserFormValues> = async (data) => {
    const payload = {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      email: data.email || null,
      role_ids: data.role_ids,
      enabled: data.enabled === "true",
      image: data.image || null,
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش کاربر" : "ایجاد کاربر"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* نام */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام *</label>
              <Controller
                name="first_name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="نام کاربر" />
                )}
              />
              {errors.first_name && <p className="text-xs text-red-500">{errors.first_name.message}</p>}
            </div>

            {/* نام خانوادگی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام خانوادگی *</label>
              <Controller
                name="last_name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="نام خانوادگی" />
                )}
              />
              {errors.last_name && <p className="text-xs text-red-500">{errors.last_name.message}</p>}
            </div>

            {/* موبایل */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">موبایل *</label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="09xxxxxxxxx"
                    dir="ltr"
                  />
                )}
              />
              {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
            </div>

            {/* ایمیل */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">ایمیل</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="example@domain.com"
                    dir="ltr"
                  />
                )}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* نقش‌ها (چندانتخابی) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نقش‌ها *</label>
              <Controller
                name="role_ids"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={roles || []}
                    value={field.value.map(String)}
                    onChange={(val) => {
                      const selected = Array.isArray(val) ? val : [];
                      field.onChange(selected.map(Number));
                    }}
                    isMulti
                    placeholder="انتخاب نقش‌ها"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                  />
                )}
              />
              {rolesLoading && (
                <p className="text-xs text-muted-foreground">در حال بارگذاری نقش‌ها...</p>
              )}
              {errors.role_ids && <p className="text-xs text-red-500">{errors.role_ids.message}</p>}
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
                    onChange={(val) => {
                      const selected = val as string;
                      field.onChange(selected || "true");
                    }}
                    placeholder="انتخاب وضعیت"
                    className="w-full"
                  />
                )}
              />
              {errors.enabled && <p className="text-xs text-red-500">{errors.enabled.message}</p>}
            </div>

            {/* تصویر پروفایل */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">تصویر پروفایل</label>
              <Controller
                name="image"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    multiple={false}
                    maxFiles={1}
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] || "")}
                    folder="users" 
                  />
                )}
              />
              {errors.image && <p className="text-xs text-red-500">{errors.image.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد کاربر"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}