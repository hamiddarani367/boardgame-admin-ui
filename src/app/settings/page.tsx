"use client";

import { useEffect } from "react"; // ✅ افزودن ایمپورت
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const settingsSchema = z.object({
  site_name: z.string().min(2, "نام سایت حداقل ۲ حرف"),
  site_description: z.string().optional(),
  support_email: z.string().email("ایمیل معتبر نیست").optional().or(z.literal("")),
  support_phone: z.string().optional(),
  logo: z.string().optional(),
  address: z.string().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const router = useRouter();

  const { data: settingsData, isLoading } = useApiQuery<{ settings: any }>(
    "/settings",
    ["site-settings"]
  );

  const updateSettings = useApiMutation("/settings", "PUT", ["site-settings"]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_name: "",
      site_description: "",
      support_email: "",
      support_phone: "",
      logo: "",
      address: "",
    },
  });

  // به‌روزرسانی فرم پس از دریافت داده
  useEffect(() => {
    if (settingsData?.settings) {
      reset(settingsData.settings);
    }
  }, [settingsData, reset]);

  const onSubmitForm = async (data: any) => {
    try {
      await updateSettings.mutateAsync(data);
      toast.success("تنظیمات با موفقیت ذخیره شد");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ذخیره تنظیمات");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">تنظیمات سایت</h1>

      <Card className="rounded-none shadow-sm">
        <CardHeader>
          <CardTitle>اطلاعات عمومی</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">نام سایت *</label>
                <Controller
                  name="site_name"
                  control={control}
                  render={({ field }) => (
                    <AppInput value={field.value} onChange={field.onChange} placeholder="Board Kingdom" />
                  )}
                />
                {errors.site_name && <p className="text-xs text-red-500">{errors.site_name.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">ایمیل پشتیبانی</label>
                <Controller
                  name="support_email"
                  control={control}
                  render={({ field }) => (
                    <AppInput value={field.value || ""} onChange={field.onChange} placeholder="support@example.com" dir="ltr" />
                  )}
                />
                {errors.support_email && <p className="text-xs text-red-500">{errors.support_email.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">تلفن پشتیبانی</label>
                <Controller
                  name="support_phone"
                  control={control}
                  render={({ field }) => (
                    <AppInput value={field.value || ""} onChange={field.onChange} placeholder="021-12345678" dir="ltr" />
                  )}
                />
                {errors.support_phone && <p className="text-xs text-red-500">{errors.support_phone.message}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">آدرس</label>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <AppInput value={field.value || ""} onChange={field.onChange} placeholder="تهران، ..." />
                  )}
                />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">توضیحات سایت</label>
                <Controller
                  name="site_description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="توضیح کوتاه درباره سایت"
                      rows={4}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                />
                {errors.site_description && <p className="text-xs text-red-500">{errors.site_description.message}</p>}
              </div>

              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-sm font-medium">لوگو</label>
                <Controller
                  name="logo"
                  control={control}
                  render={({ field }) => (
                    <ImageUploader
                      multiple={false}
                      maxFiles={1}
                      value={field.value ? [field.value] : []}
                      onChange={(urls) => field.onChange(urls[0] || "")}
                    />
                  )}
                />
                {errors.logo && <p className="text-xs text-red-500">{errors.logo.message}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <AppButton type="submit" variant="blue" loading={isSubmitting}>
                ذخیره تنظیمات
              </AppButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}