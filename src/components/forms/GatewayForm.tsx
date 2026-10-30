"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { BooleanSelect } from "@/components/shared/BooleanSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// ==================== تایپ‌ها ====================
export interface GatewayPayload {
  name: string;
  slug: string;
  type: string; // "online" | "offline" | "cash"
  config: string; // JSON string
  enabled: boolean;
  sort_order: number;
}

interface GatewayFormProps {
  initialData?: GatewayPayload & { id?: number };
  isEdit?: boolean;
  onSubmit: (data: GatewayPayload) => Promise<void> | void;
}

// ==================== schema ====================
const gatewayFormSchema = z.object({
  name: z.string().min(1, "نام درگاه الزامی است").max(100),
  slug: z.string().min(1, "اسلاگ الزامی است").max(50),
  type: z.string().min(1, "نوع درگاه را انتخاب کنید"),
  config: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Config باید JSON معتبر باشد" }
  ),
  enabled: z.boolean(),
  sort_order: z.string().optional().or(z.literal("")),
});

type GatewayFormValues = z.infer<typeof gatewayFormSchema>;

const typeOptions: Option[] = [
  { value: "online", label: "آنلاین" },
  { value: "offline", label: "آفلاین" },
  { value: "cash", label: "نقدی" },
];

export function GatewayForm({ initialData, isEdit = false, onSubmit }: GatewayFormProps) {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GatewayFormValues>({
    resolver: zodResolver(gatewayFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      type: initialData?.type || "online",
      config: initialData?.config || "{}",
      enabled: initialData?.enabled ?? true,
      sort_order: initialData?.sort_order !== undefined ? String(initialData.sort_order) : "",
    },
  });

  const onSubmitForm = async (data: GatewayFormValues) => {
    const payload: GatewayPayload = {
      name: data.name,
      slug: data.slug,
      type: data.type,
      config: data.config,
      enabled: data.enabled,
      sort_order: data.sort_order ? Number(data.sort_order) : 0,
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
            {/* نام */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نام درگاه *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="مثلاً زرین‌پال"
                  />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* اسلاگ */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">اسلاگ *</label>
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="مثلاً zarinpal"
                  />
                )}
              />
              {errors.slug && <p className="text-xs text-red-500">{errors.slug.message}</p>}
            </div>

            {/* نوع */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نوع درگاه *</label>
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

            {/* ترتیب نمایش */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">ترتیب نمایش</label>
              <Controller
                name="sort_order"
                control={control}
                render={({ field }) => (
                  <AppInput
                    thousandsSeparator={false}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱"
                  />
                )}
              />
              {errors.sort_order && (
                <p className="text-xs text-red-500">{errors.sort_order.message}</p>
              )}
            </div>

            {/* فعال/غیرفعال */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">وضعیت</label>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <BooleanSelect
                    value={field.value}
                    onChange={field.onChange}
                    trueLabel="فعال"
                    falseLabel="غیرفعال"
                    placeholder="انتخاب وضعیت"
                    className="w-full"
                  />
                )}
              />
              {errors.enabled && <p className="text-xs text-red-500">{errors.enabled.message}</p>}
            </div>

            {/* Config (JSON) */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">Config (JSON) *</label>
              <Controller
                name="config"
                control={control}
                render={({ field }) => (
                  <textarea
                    value={field.value}
                    onChange={field.onChange}
                    rows={5}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                    placeholder='{"merchant_id": "..."}'
                    dir="ltr"
                  />
                )}
              />
              {errors.config && (
                <p className="text-xs text-red-500">{errors.config.message}</p>
              )}
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