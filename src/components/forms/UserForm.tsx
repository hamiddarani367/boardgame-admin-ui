"use client";

import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useRoles } from "@/hooks/useRoles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const userFormSchema = z.object({
  name: z.string().min(2, "نام حداقل ۲ حرف باید داشته باشد"),
  mobile: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست (مثال: ۰۹۱۲۳۴۵۶۷۸)"),
  roles: z.array(z.string()).min(1, "حداقل یک نقش انتخاب کنید"),
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
  images: z.array(z.string()),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

export function UserForm({ initialData, isEdit = false, onSubmit }: UserFormProps) {
  const router = useRouter();
  const { data: roles, isLoading: rolesLoading } = useRoles();

  const roleOptions: Option[] =
    roles?.map((r: any) => ({
      value: String(r.id),
      label: r.title,
      ...r,
    })) || [];

  const statusOptions: Option[] = [
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیرفعال" },
  ];

  const initialRoles: string[] = initialData?.roles
    ? initialData.roles.map((role: any) => String(role.id))
    : [];

  const initialStatus: string = initialData?.is_active ? "active" : "inactive";
  const initialImages: string[] = initialData?.images || [];

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      mobile: initialData?.mobile || "",
      roles: initialRoles,
      status: initialStatus,
      images: initialImages,
    },
  });

  const onSubmitForm: SubmitHandler<UserFormValues> = async (data) => {
    const payload = {
      name: data.name,
      mobile: data.mobile,
      role_ids: data.roles.map(Number),
      is_active: data.status === "active",
      images: data.images,
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
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="نام کاربر" />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* موبایل */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">موبایل *</label>
              <Controller
                name="mobile"
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
              {errors.mobile && <p className="text-xs text-red-500">{errors.mobile.message}</p>}
            </div>

            {/* نقش‌ها */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نقش‌ها *</label>
              <Controller
                name="roles"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={roleOptions}
                    value={field.value}
                    onChange={(val) => {
                      const selectedIds = Array.isArray(val)
                        ? val.map((opt: any) => String(opt.value))
                        : [];
                      field.onChange(selectedIds);
                    }}
                    isMulti
                    placeholder="انتخاب نقش‌ها"
                    className="w-full"
                    valueKey="id"
                    labelKey="title"
                  />
                )}
              />
              {rolesLoading && (
                <p className="text-xs text-muted-foreground">در حال بارگذاری نقش‌ها...</p>
              )}
              {errors.roles && <p className="text-xs text-red-500">{errors.roles.message}</p>}
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
                      const selectedOption = val as Option | null;
                      field.onChange(selectedOption ? selectedOption.value : "");
                    }}
                    placeholder="انتخاب وضعیت"
                    className="w-full"
                  />
                )}
              />
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>

            {/* تصاویر */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">تصاویر</label>
              <Controller
                name="images"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    multiple
                    maxFiles={5}
                    value={field.value || []}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.images && <p className="text-xs text-red-500">{errors.images.message}</p>}
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