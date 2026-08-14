"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

// تعریف schema
const addressFormSchema = z.object({
  user_id: z.string().min(1, "کاربر را انتخاب کنید"),
  address: z.string().min(5, "آدرس حداقل ۵ حرف"),
  city: z.string().min(2, "شهر را وارد کنید"),
  postal_code: z.string().regex(/^\d{10}$/, "کد پستی باید ۱۰ رقم باشد"),
  is_default: z.string().min(1, "وضعیت پیش‌فرض را انتخاب کنید"),
  label: z.string().optional(), // اختیاری
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

interface AddressFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

export function AddressForm({ initialData, isEdit = false, onSubmit }: AddressFormProps) {
  const router = useRouter();

  // دریافت لیست کاربران برای انتخاب
  const { data: usersData, isLoading: usersLoading } = useApiQuery<{ users: any[] }>(
    "/users",
    ["users-list-for-address"]
  );

  const userOptions: Option[] =
    usersData?.users?.map((u: any) => ({
      value: String(u.id),
      label: u.name,
      ...u,
    })) || [];

  const defaultOptions: Option[] = [
    { value: "true", label: "بله" },
    { value: "false", label: "خیر" },
  ];

  const initialUserId = initialData?.user_id ? String(initialData.user_id) : "";
  const initialIsDefault = initialData?.is_default ? "true" : "false";
  const initialPostalCode = initialData?.postal_code || "";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      user_id: initialUserId,
      address: initialData?.address || "",
      city: initialData?.city || "",
      postal_code: initialPostalCode,
      is_default: initialIsDefault,
      label: initialData?.label || "",
    },
  });

  const onSubmitForm = async (data: any) => {
    const payload = {
      user_id: Number(data.user_id),
      address: data.address,
      city: data.city,
      postal_code: data.postal_code,
      is_default: data.is_default === "true",
      label: data.label || null,
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش آدرس" : "ایجاد آدرس"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* کاربر */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کاربر *</label>
              <Controller
                name="user_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={userOptions}
                    value={field.value}
                    onChange={(val) => {
                      const option = val as Option | null;
                      field.onChange(option ? option.value : "");
                    }}
                    placeholder="انتخاب کاربر"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                  />
                )}
              />
              {usersLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>}
              {errors.user_id && <p className="text-xs text-red-500">{errors.user_id.message}</p>}
            </div>

            {/* برچسب */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">برچسب (مثلاً منزل، محل کار)</label>
              <Controller
                name="label"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value || ""} onChange={field.onChange} placeholder="اختیاری" />
                )}
              />
              {errors.label && <p className="text-xs text-red-500">{errors.label.message}</p>}
            </div>

            {/* آدرس */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">آدرس *</label>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="آدرس کامل" />
                )}
              />
              {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
            </div>

            {/* شهر */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">شهر *</label>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="شهر" />
                )}
              />
              {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
            </div>

            {/* کد پستی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کد پستی *</label>
              <Controller
                name="postal_code"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="۱۰ رقم"
                    dir="ltr"
                  />
                )}
              />
              {errors.postal_code && (
                <p className="text-xs text-red-500">{errors.postal_code.message}</p>
              )}
            </div>

            {/* پیش‌فرض */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">پیش‌فرض *</label>
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={defaultOptions}
                    value={field.value}
                    onChange={(val) => {
                      const option = val as Option | null;
                      field.onChange(option ? option.value : "");
                    }}
                    placeholder="انتخاب"
                    className="w-full"
                  />
                )}
              />
              {errors.is_default && (
                <p className="text-xs text-red-500">{errors.is_default.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد آدرس"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}