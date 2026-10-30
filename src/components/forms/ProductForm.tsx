"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

// بارگذاری داینامیک RichTextEditor برای جلوگیری از خطای SSR
const RichTextEditor = dynamic(
  () => import("@/components/shared/RichTextEditor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <div className="h-[200px] bg-gray-100 animate-pulse rounded-md" />,
  }
);

// ==================== تایپ‌ها ====================
interface Category {
  id: number;
  name: string;
}

interface Brand {
  id: number;
  name: string;
}

interface Attribute {
  id: number;
  name: string;
  unit?: string;
  description?: string;
}

interface AttributeValueInput {
  attribute_id: number;
  value: string;
}

interface ProductFormProps {
  initialData?: {
    id?: number;
    name: string;
    persian_title?: string;
    description?: string;
    full_description?: string;
    price: number;
    discounted_price?: number | null;
    cost_price?: number | null;
    category_id?: number;
    brand_id?: number | null;
    image?: string;
    images: string[];
    tags?: string[];
    stock_count?: number;
    is_featured?: boolean;
    is_best_seller?: boolean;
    is_new?: boolean;
    enabled: boolean;
    attribute_values?: AttributeValueInput[];
  };
  isEdit?: boolean;
  onSubmit: (data: {
    name: string;
    persian_title: string | null;
    description: string | null;
    full_description: string | null;
    price: number;
    discounted_price: number | null;
    cost_price: number | null;
    category_id: number;
    brand_id: number | null;
    image: string | null;
    images: string[];
    tags: string[];
    stock_count: number;
    is_featured: boolean;
    is_best_seller: boolean;
    is_new: boolean;
    enabled: boolean;
    attribute_values: AttributeValueInput[];
  }) => Promise<void> | void;
}

// ==================== schema ====================
const productFormSchema = z.object({
  name: z.string().min(2, "عنوان محصول حداقل ۲ حرف"),
  persian_title: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  full_description: z.string().optional().or(z.literal("")),
  price: z.string().regex(/^\d+$/, "قیمت باید عدد باشد"),
  discounted_price: z.string().optional().or(z.literal("")),
  cost_price: z.string().optional().or(z.literal("")),
  category_id: z.string().min(1, "دسته‌بندی را انتخاب کنید"),
  brand_id: z.string().optional().or(z.literal("")),
  image: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).min(1, "حداقل یک تصویر لازم است"),
  tags: z.array(z.string()),
  stock_count: z.string().optional().or(z.literal("")),
  is_featured: z.string().min(1, "وضعیت ویژه را مشخص کنید"),
  is_best_seller: z.string().min(1, "وضعیت پرفروش را مشخص کنید"),
  is_new: z.string().min(1, "وضعیت جدید بودن را مشخص کنید"),
  enabled: z.string().min(1, "وضعیت را انتخاب کنید"),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const statusOptions = [
  { value: "true", label: "فعال" },
  { value: "false", label: "غیرفعال" },
];

const booleanOptions = [
  { value: "true", label: "بله" },
  { value: "false", label: "خیر" },
];

export function ProductForm({
  initialData,
  isEdit = false,
  onSubmit,
}: ProductFormProps) {
  const router = useRouter();

  // دریافت دسته‌بندی‌ها
  const { data: categoriesData, isLoading: categoriesLoading } = useApiQuery<Category[]>(
    "/admin/categories/all",
    ["categories-list"]
  );

  // دریافت برندها
  const { data: brandsData, isLoading: brandsLoading } = useApiQuery<Brand[]>(
    "/admin/brands/all",
    ["brands-list"]
  );

  // دریافت تگ‌های موجود
  const { data: tagsData, isLoading: tagsLoading } = useApiQuery<string[]>(
    "/admin/tags/all",
    ["tags-list"]
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      persian_title: "",
      description: "",
      full_description: "",
      price: "",
      discounted_price: "",
      cost_price: "",
      category_id: "",
      brand_id: "",
      image: "",
      images: [],
      tags: [],
      stock_count: "",
      is_featured: "false",
      is_best_seller: "false",
      is_new: "false",
      enabled: "true",
    },
  });

  const selectedCategoryId = watch("category_id");

  // دریافت ویژگی‌های دسته‌بندی انتخابی
  const {
    data: attributesData,
    isLoading: attributesLoading,
  } = useApiQuery<Attribute[]>(
    `/admin/categories/${selectedCategoryId}/attributes`,
    ["category-attributes", selectedCategoryId],
    undefined,
    { enabled: !!selectedCategoryId }
  );

  // state برای مقادیر ویژگی‌ها
  const [attributeValues, setAttributeValues] = useState<Record<number, string>>({});

  // پر کردن فرم در ویرایش
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        persian_title: initialData.persian_title || "",
        description: initialData.description || "",
        full_description: initialData.full_description || "",
        price: initialData.price ? String(initialData.price) : "",
        discounted_price: initialData.discounted_price ? String(initialData.discounted_price) : "",
        cost_price: initialData.cost_price ? String(initialData.cost_price) : "",
        category_id: initialData.category_id ? String(initialData.category_id) : "",
        brand_id: initialData.brand_id ? String(initialData.brand_id) : "",
        image: initialData.image || "",
        images: initialData.images || [],
        tags: initialData.tags || [],
        stock_count: initialData.stock_count !== undefined ? String(initialData.stock_count) : "",
        is_featured: initialData.is_featured ? "true" : "false",
        is_best_seller: initialData.is_best_seller ? "true" : "false",
        is_new: initialData.is_new ? "true" : "false",
        enabled: initialData.enabled ? "true" : "false",
      });

      const initialAttrValues: Record<number, string> = {};
      initialData.attribute_values?.forEach((av) => {
        initialAttrValues[av.attribute_id] = av.value;
      });
      setAttributeValues(initialAttrValues);
    }
  }, [initialData, reset]);

  const handleAttributeChange = (attributeId: number, value: string) => {
    setAttributeValues((prev) => ({ ...prev, [attributeId]: value }));
  };

  const onSubmitForm = async (data: ProductFormValues) => {
    const attributeValuesArray: AttributeValueInput[] = attributesData
      ? attributesData.map((attr) => ({
          attribute_id: attr.id,
          value: attributeValues[attr.id] || "",
        }))
      : [];

    const payload = {
      name: data.name,
      persian_title: data.persian_title || null,
      description: data.description || null,
      full_description: data.full_description || null,
      price: Number(data.price),
      discounted_price: data.discounted_price ? Number(data.discounted_price) : null,
      cost_price: data.cost_price ? Number(data.cost_price) : null,
      category_id: Number(data.category_id),
      brand_id: data.brand_id ? Number(data.brand_id) : null,
      image: data.image || null,
      images: data.images,
      tags: data.tags,
      stock_count: data.stock_count ? Number(data.stock_count) : 0,
      is_featured: data.is_featured === "true",
      is_best_seller: data.is_best_seller === "true",
      is_new: data.is_new === "true",
      enabled: data.enabled === "true",
      attribute_values: attributeValuesArray,
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
            {/* عنوان */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">عنوان *</label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="Pandemic" />
                )}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* عنوان فارسی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">عنوان فارسی</label>
              <Controller
                name="persian_title"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value || ""} onChange={field.onChange} placeholder="پندمیک" />
                )}
              />
              {errors.persian_title && <p className="text-xs text-red-500">{errors.persian_title.message}</p>}
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
                    placeholder="مثلاً ۱٬۶۰۰٬۰۰۰"
                  />
                )}
              />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>

            {/* قیمت با تخفیف */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">قیمت با تخفیف</label>
              <Controller
                name="discounted_price"
                control={control}
                render={({ field }) => (
                  <AppInput
                    dir="rtl"
                    numeric
                    suffix="تومان"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱٬۲۵۰٬۰۰۰"
                  />
                )}
              />
              {errors.discounted_price && <p className="text-xs text-red-500">{errors.discounted_price.message}</p>}
            </div>

            {/* قیمت تمام‌شده */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">قیمت تمام‌شده (قیمت خرید)</label>
              <Controller
                name="cost_price"
                control={control}
                render={({ field }) => (
                  <AppInput
                    dir="rtl"
                    numeric
                    suffix="تومان"
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱٬۰۰۰٬۰۰۰"
                  />
                )}
              />
              {errors.cost_price && <p className="text-xs text-red-500">{errors.cost_price.message}</p>}
            </div>

            {/* دسته‌بندی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">دسته‌بندی *</label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={categoriesData || []}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setAttributeValues({});
                    }}
                    placeholder="انتخاب دسته‌بندی"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
              {categoriesLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>}
              {errors.category_id && <p className="text-xs text-red-500">{errors.category_id.message}</p>}
            </div>

            {/* برند */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">برند</label>
              <Controller
                name="brand_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={brandsData || []}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب برند (اختیاری)"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
              {brandsLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>}
              {errors.brand_id && <p className="text-xs text-red-500">{errors.brand_id.message}</p>}
            </div>

            {/* وضعیت */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">وضعیت *</label>
              <Controller
                name="enabled"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={statusOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب وضعیت"
                    className="w-full"
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              />
              {errors.enabled && <p className="text-xs text-red-500">{errors.enabled.message}</p>}
            </div>

            {/* ویژه */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">ویژه</label>
              <Controller
                name="is_featured"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={booleanOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب کنید"
                    className="w-full"
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              />
              {errors.is_featured && <p className="text-xs text-red-500">{errors.is_featured.message}</p>}
            </div>

            {/* پرفروش */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">پرفروش (is_best_seller)</label>
              <Controller
                name="is_best_seller"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={booleanOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب کنید"
                    className="w-full"
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              />
              {errors.is_best_seller && <p className="text-xs text-red-500">{errors.is_best_seller.message}</p>}
            </div>

            {/* جدید */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">جدید (is_new)</label>
              <Controller
                name="is_new"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={booleanOptions}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب کنید"
                    className="w-full"
                    valueKey="value"
                    labelKey="label"
                  />
                )}
              />
              {errors.is_new && <p className="text-xs text-red-500">{errors.is_new.message}</p>}
            </div>

            {/* موجودی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">موجودی</label>
              <Controller
                name="stock_count"
                control={control}
                render={({ field }) => (
                  <AppInput
                    numeric
                    thousandsSeparator={false}
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="مثلاً ۱۲"
                    dir="ltr"
                  />
                )}
              />
              {errors.stock_count && <p className="text-xs text-red-500">{errors.stock_count.message}</p>}
            </div>

            {/* تگ‌ها */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">تگ‌ها</label>
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={tagsData || []}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    isMulti
                    placeholder="انتخاب تگ‌ها"
                    className="w-full"
                    isSearchable
                    valueKey="id"
                    labelKey="name"
                  />
                )}
              />
              {tagsLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری تگ‌ها...</p>}
              {errors.tags && <p className="text-xs text-red-500">{errors.tags.message}</p>}
            </div>

            {/* ویژگی‌های دسته‌بندی */}
            {selectedCategoryId && (
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {attributesLoading ? (
                  <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال بارگذاری ویژگی‌ها...
                  </div>
                ) : attributesData && attributesData.length > 0 ? (
                  attributesData.map((attr) => (
                    <div key={attr.id} className="flex flex-col gap-2">
                      <label className="text-sm font-medium">
                        {attr.name}
                        {attr.unit && <span className="mr-1 text-xs text-muted-foreground">({attr.unit})</span>}
                      </label>
                      <AppInput
                        value={attributeValues[attr.id] || ""}
                        onChange={(e) => handleAttributeChange(attr.id, e.target.value)}
                        placeholder={`مقدار ${attr.name}`}
                        suffix={attr.unit}
                      />
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-sm text-muted-foreground">
                    ویژگی‌ای برای این دسته‌بندی تعریف نشده است.
                  </div>
                )}
              </div>
            )}

            {/* توضیح کوتاه */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">توضیح کوتاه</label>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <textarea
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="توضیح کوتاه محصول"
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                )}
              />
              {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
            </div>

            {/* توضیح کامل */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">توضیح کامل</label>
              <Controller
                name="full_description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="توضیحات کامل محصول..."
                    minHeight="250px"
                  />
                )}
              />
              {errors.full_description && <p className="text-xs text-red-500">{errors.full_description.message}</p>}
            </div>

            {/* تصویر اصلی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">تصویر اصلی</label>
              <Controller
                name="image"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    multiple={false}
                    maxFiles={1}
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] || "")}
                    folder="products"
                  />
                )}
              />
              {errors.image && <p className="text-xs text-red-500">{errors.image.message}</p>}
            </div>

            {/* گالری تصاویر */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">گالری تصاویر *</label>
              <Controller
                name="images"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    multiple
                    maxFiles={5}
                    value={field.value || []}
                    onChange={field.onChange}
                    folder="products"
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