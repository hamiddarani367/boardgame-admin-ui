"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { PersianDateTimeRangePicker } from "@/components/shared/PersianDateTimeRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateObject } from "react-multi-date-picker";

// تعریف schema با Zod
const discountFormSchema = z.object({
  code: z.string().min(2, "کد تخفیف حداقل ۲ حرف"),
  type: z.string().min(1, "نوع تخفیف را انتخاب کنید"),
  value: z.string().optional(), // مقدار عددی (درصد یا مبلغ)
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
  max_usage: z.string().optional(), // حداکثر استفاده
});

type DiscountFormValues = z.infer<typeof discountFormSchema>;

interface DiscountFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

const discountTypeOptions: Option[] = [
  { value: "percentage", label: "درصدی" },
  { value: "fixed_amount", label: "مبلغ ثابت" },
  { value: "free_shipping", label: "ارسال رایگان" },
];

const statusOptions: Option[] = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

export function DiscountForm({ initialData, isEdit = false, onSubmit }: DiscountFormProps) {
  const router = useRouter();

  // تاریخ‌ها
  const [dateRange, setDateRange] = useState<{
    from: DateObject | null;
    to: DateObject | null;
  }>({
    from: initialData?.start_date
      ? new DateObject({ date: new Date(initialData.start_date) })
      : null,
    to: initialData?.end_date
      ? new DateObject({ date: new Date(initialData.end_date) })
      : null,
  });

  const initialType = initialData?.type || "";
  const initialStatus = initialData?.is_active ? "active" : "inactive";
  const initialValue = initialData?.value ? String(initialData.value) : "";
  const initialMaxUsage = initialData?.max_usage ? String(initialData.max_usage) : "";

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      type: initialType,
      value: initialValue,
      status: initialStatus,
      max_usage: initialMaxUsage,
    },
  });

  const selectedType = watch("type");

  const onSubmitForm = async (data: any) => {
    // اگر نوع free_shipping باشد مقدار value لازم نیست
    if (selectedType !== "free_shipping" && !data.value) {
      alert("لطفاً مقدار تخفیف را وارد کنید");
      return;
    }

    const payload = {
      code: data.code,
      type: data.type,
      value: selectedType === "free_shipping" ? null : Number(data.value),
      is_active: data.status === "active",
      max_usage: data.max_usage ? Number(data.max_usage) : null,
      start_date: dateRange.from ? dateRange.from.toDate().toISOString() : null,
      end_date: dateRange.to ? dateRange.to.toDate().toISOString() : null,
    };

    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش تخفیف" : "ایجاد تخفیف"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* کد تخفیف */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کد تخفیف *</label>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="مثلاً OFF10" dir="ltr" />
                )}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
            </div>

            {/* نوع تخفیف */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نوع تخفیف *</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={discountTypeOptions}
                    value={field.value}
                    onChange={(val) => {
                      const option = val as Option | null;
                      field.onChange(option ? option.value : "");
                    }}
                    placeholder="انتخاب نوع"
                    className="w-full"
                  />
                )}
              />
              {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
            </div>

            {/* فیلد داینامیک بر اساس نوع */}
            {selectedType === "percentage" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">درصد تخفیف *</label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      numeric
                      suffix="٪"
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="مثلاً ۲۰"
                      dir="ltr"
                    />
                  )}
                />
                {errors.value && <p className="text-xs text-red-500">{errors.value.message}</p>}
              </div>
            )}

            {selectedType === "fixed_amount" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">مبلغ تخفیف *</label>
                <Controller
                  name="value"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      numeric
                      suffix="تومان"
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="مثلاً ۵۰٬۰۰۰"
                      dir="rtl"
                    />
                  )}
                />
                {errors.value && <p className="text-xs text-red-500">{errors.value.message}</p>}
              </div>
            )}

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

            {/* حداکثر استفاده */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">حداکثر استفاده</label>
              <Controller
                name="max_usage"
                control={control}
                render={({ field }) => (
                  <AppInput
                    numeric
                    thousandsSeparator={false}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱۰۰"
                    dir="ltr"
                  />
                )}
              />
              {errors.max_usage && <p className="text-xs text-red-500">{errors.max_usage.message}</p>}
            </div>

            {/* بازه تاریخ */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">بازه زمانی تخفیف</label>
              <PersianDateTimeRangePicker
                value={dateRange}
                onChange={setDateRange}
                fromPlaceholder="از تاریخ و زمان"
                toPlaceholder="تا تاریخ و زمان"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد تخفیف"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}