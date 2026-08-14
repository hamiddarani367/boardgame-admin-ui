"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput, Option } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useCategories } from "@/hooks/useCategories";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { apiClient } from "@/hooks/useApi"; // برای آپلود تصویر

const productFormSchema = z.object({
  name: z.string().min(2, "نام محصول حداقل ۲ حرف"),
  description: z.string(),
  price: z.string().regex(/^\d+$/, "قیمت باید عدد باشد"),
  category_id: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  images: z.array(z.string()).min(1, "حداقل یک تصویر لازم است"),
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormProps {
  initialData?: any;
  isEdit?: boolean;
  onSubmit: (data: any) => Promise<void> | void;
}

export function ProductForm({ initialData, isEdit = false, onSubmit }: ProductFormProps) {
  const router = useRouter();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const categoryOptions: Option[] =
    categories?.map((c: any) => ({
      value: String(c.id),
      label: c.title,
      ...c,
    })) || [];

  const statusOptions: Option[] = [
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیرفعال" },
  ];

  const initialCategory = initialData?.category_id ? String(initialData.category_id) : "";
  const initialStatus = initialData?.is_active ? "active" : "inactive";
  const initialImages = initialData?.images || [];

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      price: initialData?.price ? String(initialData.price) : "",
      category_id: initialCategory,
      images: initialImages,
      status: initialStatus,
    },
  });

  const selectedCategoryId = watch("category_id");

  const [attributes, setAttributes] = useState<any[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!selectedCategoryId) {
      setAttributes([]);
      setAttributeValues({});
      return;
    }

    const fetchAttributes = async () => {
      try {
        const res = await fetch(`/api/categories/${selectedCategoryId}/attributes`);
        if (!res.ok) throw new Error("خطا در دریافت ویژگی‌ها");
        const data = await res.json();
        setAttributes(data.attributes || []);

        if (initialData?.attributes) {
          const initialValues: Record<string, string> = {};
          initialData.attributes.forEach((attr: any) => {
            initialValues[String(attr.attribute_id)] = attr.value;
          });
          setAttributeValues(initialValues);
        } else {
          setAttributeValues({});
        }
      } catch (error) {
        console.error(error);
        setAttributes([]);
      }
    };

    fetchAttributes();
  }, [selectedCategoryId, initialData]);

  const handleAttributeChange = (attributeId: number, value: string) => {
    setAttributeValues((prev) => ({ ...prev, [String(attributeId)]: value }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data.url;
  };

  const onSubmitForm = async (data: any) => {
    const attributeValuesArray = attributes.map((attr) => ({
      attribute_id: attr.id,
      value: attributeValues[String(attr.id)] || "",
    }));

    const payload = {
      name: data.name,
      description: data.description,
      price: Number(data.price),
      category_id: Number(data.category_id),
      images: data.images,
      is_active: data.status === "active",
      attributes: attributeValuesArray,
    };
    await onSubmit(payload);
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش محصول" : "ایجاد محصول"}</CardTitle>
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
                  <AppInput value={field.value} onChange={field.onChange} placeholder="نام محصول" />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* قیمت */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">قیمت *</label>
              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <AppInput
                    dir="rtl"
                    numeric
                    suffix="تومان"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱۲۰٬۰۰۰"
                  />
                )}
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>

            {/* دسته‌بندی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">دسته‌بندی *</label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={categoryOptions}
                    value={field.value}
                    onChange={(val) => {
                      const option = val as Option | null;
                      field.onChange(option ? option.value : "");
                    }}
                    placeholder="انتخاب دسته‌بندی"
                    className="w-full"
                    valueKey="id"
                    labelKey="title"
                  />
                )}
              />
              {categoriesLoading && (
                <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>
              )}
              {errors.category_id && (
                <p className="text-xs text-red-500">{errors.category_id.message}</p>
              )}
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

            {/* ویژگی‌های داینامیک */}
            {attributes.length > 0 && (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {attributes.map((attr) => (
                  <div key={attr.id} className="flex flex-col gap-2">
                    <label className="text-sm font-medium">{attr.title}</label>
                    <AppInput
                      type={attr.type === "number" ? "number" : "text"}
                      value={attributeValues[String(attr.id)] || ""}
                      onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                      placeholder={`${attr.title}...`}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* توضیحات (ویرایشگر متن) */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">توضیحات</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="توضیحات محصول..."
                    minHeight="250px"
                    onImageUpload={uploadImage}
                  />
                )}
              />
              {errors.description && (
                <p className="text-xs text-red-500">{errors.description.message}</p>
              )}
            </div>

            {/* تصاویر */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">تصاویر *</label>
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
              {isEdit ? "ذخیره تغییرات" : "ایجاد محصول"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}