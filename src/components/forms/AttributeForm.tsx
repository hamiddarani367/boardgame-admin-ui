"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// تعریف schema
const attributeFormSchema = z.object({
  title: z.string().min(2, "عنوان ویژگی حداقل ۲ حرف"),
  type: z.string().min(1, "نوع ویژگی را انتخاب کنید"),
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
});

type AttributeFormValues = z.infer<typeof attributeFormSchema>;

interface AttributeFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

const typeOptions: Option[] = [
  { value: "text", label: "متنی" },
  { value: "number", label: "عددی" },
  { value: "boolean", label: "بله/خیر" },
  { value: "select", label: "انتخابی" },
];

const statusOptions: Option[] = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

export function AttributeForm({ initialData, isEdit = false, onSubmit }: AttributeFormProps) {
  const router = useRouter();

  const initialType = initialData?.type || "";
  const initialStatus = initialData?.is_active ? "active" : "inactive";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      type: initialType,
      status: initialStatus,
    },
  });

  const onSubmitForm = async (data: any) => {
    const payload = {
      title: data.title,
      type: data.type,
      is_active: data.status === "active",
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش ویژگی" : "ایجاد ویژگی"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* عنوان */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">عنوان *</label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="مثلاً رنگ" />
                )}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* نوع */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">نوع *</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={typeOptions}
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
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد ویژگی"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}