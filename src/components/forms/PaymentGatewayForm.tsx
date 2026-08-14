"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const paymentGatewaySchema = z.object({
  name: z.string().min(2, "نام درگاه حداقل ۲ حرف"),
  api_key: z.string().min(1, "کلید API الزامی است"),
  secret_key: z.string().min(1, "کلید مخفی الزامی است"),
  merchant_id: z.string().optional(),
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
});

type PaymentGatewayFormValues = z.infer<typeof paymentGatewaySchema>;

interface PaymentGatewayFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

const statusOptions: Option[] = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

export function PaymentGatewayForm({
  initialData,
  isEdit = false,
  onSubmit,
}: PaymentGatewayFormProps) {
  const router = useRouter();

  const initialStatus = initialData?.is_active ? "active" : "inactive";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentGatewayFormValues>({
    resolver: zodResolver(paymentGatewaySchema),
    defaultValues: {
      name: initialData?.name || "",
      api_key: initialData?.api_key || "",
      secret_key: initialData?.secret_key || "",
      merchant_id: initialData?.merchant_id || "",
      status: initialStatus,
    },
  });

  const onSubmitForm = async (data: any) => {
    const payload = {
      name: data.name,
      api_key: data.api_key,
      secret_key: data.secret_key,
      merchant_id: data.merchant_id || null,
      is_active: data.status === "active",
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش درگاه پرداخت" : "ایجاد درگاه پرداخت"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام درگاه *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="مثلاً زرین‌پال" />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کلید API *</label>
              <Controller
                name="api_key"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="API Key" dir="ltr" />
                )}
              />
              {errors.api_key && <p className="text-xs text-red-500">{errors.api_key.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کلید مخفی *</label>
              <Controller
                name="secret_key"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="Secret Key" dir="ltr" />
                )}
              />
              {errors.secret_key && <p className="text-xs text-red-500">{errors.secret_key.message}</p>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">شناسه تجاری</label>
              <Controller
                name="merchant_id"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value || ""} onChange={field.onChange} placeholder="Merchant ID" dir="ltr" />
                )}
              />
              {errors.merchant_id && <p className="text-xs text-red-500">{errors.merchant_id.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد درگاه"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}