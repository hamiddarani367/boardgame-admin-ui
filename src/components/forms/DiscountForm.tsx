"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PersianDateTimeRangePicker } from "@/components/shared/PersianDateTimeRangePicker";
import { BooleanSelect } from "@/components/shared/BooleanSelect";
import { DateObject } from "react-multi-date-picker";

// ==================== تایپ payload ====================
export interface DiscountPayload {
  code: string;
  type: string; // "percentage" | "fixed"
  value: number;
  start_date: string | null;
  end_date: string | null;
  max_uses: number;
  per_user_limit: number;
  min_order_amount: number;
  enabled: boolean;
}

interface DiscountFormProps {
  initialData?: DiscountPayload & { id?: number };
  isEdit?: boolean;
  onSubmit: (data: DiscountPayload) => Promise<void> | void;
}

// ==================== schema ====================
const discountFormSchema = z.object({
  code: z.string().min(2, "کد تخفیف حداقل ۲ حرف"),
  type: z.string().min(1, "نوع تخفیف را انتخاب کنید"),
  value: z.string().min(1, "مقدار تخفیف را وارد کنید"),
  max_uses: z.string().optional().or(z.literal("")),
  per_user_limit: z.string().optional().or(z.literal("")),
  min_order_amount: z.string().optional().or(z.literal("")),
  enabled: z.boolean(), // ✅ boolean
});

type DiscountFormValues = z.infer<typeof discountFormSchema>;

const typeOptions: Option[] = [
  { value: "percentage", label: "درصدی" },
  { value: "fixed", label: "مبلغ ثابت" },
];

export function DiscountForm({ initialData, isEdit = false, onSubmit }: DiscountFormProps) {
  const router = useRouter();

  // مدیریت بازه تاریخ
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

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DiscountFormValues>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: {
      code: initialData?.code || "",
      type: initialData?.type || "percentage",
      value: initialData?.value ? String(initialData.value) : "",
      max_uses: initialData?.max_uses !== undefined ? String(initialData.max_uses) : "",
      per_user_limit:
        initialData?.per_user_limit !== undefined ? String(initialData.per_user_limit) : "1",
      min_order_amount:
        initialData?.min_order_amount !== undefined ? String(initialData.min_order_amount) : "",
      enabled: initialData?.enabled ?? false, // ✅ boolean
    },
  });

  const discountType = watch("type");

  const onSubmitForm = async (data: DiscountFormValues) => {
    const payload: DiscountPayload = {
      code: data.code,
      type: data.type,
      value: Number(data.value),
      start_date: dateRange.from ? dateRange.from.toDate().toISOString() : null,
      end_date: dateRange.to ? dateRange.to.toDate().toISOString() : null,
      max_uses: data.max_uses ? Number(data.max_uses) : 0,
      per_user_limit: data.per_user_limit ? Number(data.per_user_limit) : 1,
      min_order_amount: data.min_order_amount ? Number(data.min_order_amount) : 0,
      enabled: data.enabled, // ✅ boolean
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
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="مثلاً OFF10"
                   dir="rtl"
                  />
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
                    options={typeOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب نوع"
                    className="w-full"
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              />
              {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
            </div>

            {/* مقدار تخفیف */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">
                {discountType === "percentage" ? "درصد تخفیف *" : "مبلغ تخفیف *"}
              </label>
              <Controller
                name="value"
                control={control}
                render={({ field }) => (
                  <AppInput
                    numeric
                    suffix={discountType === "percentage" ? "٪" : "تومان"}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={
                      discountType === "percentage" ? "مثلاً ۲۰" : "مثلاً ۵۰٬۰۰۰"
                    }
                   dir="rtl"
                  />
                )}
              />
              {errors.value && <p className="text-xs text-red-500">{errors.value.message}</p>}
            </div>

            {/* وضعیت */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">وضعیت *</label>
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
              {errors.enabled && <p className="text-xs text-red-500">{errors.enabled.message}</p>}
            </div>

            {/* حداکثر استفاده */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">حداکثر استفاده (۰ = نامحدود)</label>
              <Controller
                name="max_uses"
                control={control}
                render={({ field }) => (
                  <AppInput
                    numeric
                    thousandsSeparator={false}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱۰۰"
                   dir="rtl"
                  />
                )}
              />
              {errors.max_uses && (
                <p className="text-xs text-red-500">{errors.max_uses.message}</p>
              )}
            </div>

            {/* محدودیت هر کاربر */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">محدودیت استفاده برای هر کاربر</label>
              <Controller
                name="per_user_limit"
                control={control}
                render={({ field }) => (
                  <AppInput
                    numeric
                    thousandsSeparator={false}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱"
                   dir="rtl"
                  />
                )}
              />
              {errors.per_user_limit && (
                <p className="text-xs text-red-500">{errors.per_user_limit.message}</p>
              )}
            </div>

            {/* حداقل مبلغ سفارش */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">حداقل مبلغ سفارش</label>
              <Controller
                name="min_order_amount"
                control={control}
                render={({ field }) => (
                  <AppInput
                    numeric
                    suffix="تومان"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱۰۰٬۰۰۰"
                   dir="rtl"
                  />
                )}
              />
              {errors.min_order_amount && (
                <p className="text-xs text-red-500">{errors.min_order_amount.message}</p>
              )}
            </div>

            {/* بازه زمانی تخفیف */}
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