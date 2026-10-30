"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { SelectInput } from "@/components/shared/SelectInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import { ImageUploader } from "@/components/shared/ImageUploader";
import { useApiQuery } from "@/hooks/useApi";

// ==================== تایپ‌ها ====================
interface Category {
  id: number;
  name: string;
}

interface Tag {
  id: number;
  name: string;
}

// ✅ فقط id و name (و persian_title اگر بود)
interface ProductOption {
  id: number;
  name: string;
  persian_title?: string;
}

export interface ContentFormProps {
  initialData?: {
    id?: number;
    title: string;
    excerpt?: string;
    content?: string;
    type?: string;
    status?: string;
    cover_image?: string;
    cover_alt?: string;
    category_id?: number | null;
    product_id?: number | null;
    tag_ids?: number[];
    featured?: boolean;
    allow_comments?: boolean;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    canonical_url?: string;
    enabled?: boolean;
  };
  isEdit?: boolean;
  onSubmit: (data: {
    title: string;
    excerpt: string | null;
    content: string;
    type: string;
    status: string;
    cover_image: string | null;
    cover_alt: string | null;
    category_id: number | null;
    product_id: number | null;
    tag_ids: number[];
    featured: boolean;
    allow_comments: boolean;
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    canonical_url: string | null;
    enabled: boolean;
  }) => Promise<void> | void;
}

// ==================== schema ====================
const contentFormSchema = z.object({
  title: z
    .string()
    .min(2, "عنوان حداقل ۲ حرف")
    .max(255, "حداکثر ۲۵۵ حرف"),
  excerpt: z.string().max(500, "حداکثر ۵۰۰ حرف").optional().or(z.literal("")),
  content: z.string().min(1, "متن محتوا الزامی است"),
  type: z.enum(["article", "news", "guide", "review", "tutorial", "page"]),
  status: z.enum(["draft", "published", "archived", "scheduled"]),
  cover_image: z.string().max(500, "حداکثر ۵۰۰ حرف").optional().or(z.literal("")),
  cover_alt: z.string().max(255, "حداکثر ۲۵۵ حرف").optional().or(z.literal("")),
  category_id: z.number().nullable(),
  product_id: z.number().nullable(),
  tag_ids: z.array(z.number()).min(0),
  featured: z.boolean(),
  allow_comments: z.boolean(),
  meta_title: z.string().max(200, "حداکثر ۲۰۰ حرف").optional().or(z.literal("")),
  meta_description: z
    .string()
    .max(500, "حداکثر ۵۰۰ حرف")
    .optional()
    .or(z.literal("")),
  meta_keywords: z
    .string()
    .max(500, "حداکثر ۵۰۰ حرف")
    .optional()
    .or(z.literal("")),
  canonical_url: z
    .string()
    .max(500, "حداکثر ۵۰۰ حرف")
    .optional()
    .or(z.literal(""))
    .refine(
      (v) => !v || /^https?:\/\/.+/.test(v),
      "آدرس باید با http:// یا https:// شروع شود"
    ),
  enabled: z.boolean(),
});

type ContentFormValues = z.infer<typeof contentFormSchema>;

// ==================== مقادیر ثابت ====================
const TYPE_OPTIONS = [
  { id: "article", name: "مقاله" },
  { id: "news", name: "خبر" },
  { id: "guide", name: "راهنما" },
  { id: "review", name: "بررسی" },
  { id: "tutorial", name: "آموزش" },
  { id: "page", name: "صفحه" },
];

const STATUS_OPTIONS = [
  { id: "draft", name: "پیش‌نویس" },
  { id: "published", name: "منتشرشده" },
  { id: "archived", name: "بایگانی" },
  { id: "scheduled", name: "زمان‌بندی‌شده" },
];

// ==================== کامپوننت ====================
export function ContentForm({
  initialData,
  isEdit = false,
  onSubmit,
}: ContentFormProps) {
  const router = useRouter();

  // ==================== داده‌های کمکی ====================
  const { data: categoriesData, isLoading: categoriesLoading } =
    useApiQuery<Category[]>(
      "/admin/content-categories/all",
      ["content-categories-all"]
    );

  const { data: tagsData, isLoading: tagsLoading } = useApiQuery<Tag[]>(
    "/admin/content-tags/all",
    ["content-tags-all"]
  );

  // ✅ فقط id و name — endpoint سبک
  const { data: productsData, isLoading: productsLoading } =
    useApiQuery<ProductOption[]>(
      "/admin/products/all",
      ["products-all-simple"]
    );

  // ==================== فرم ====================
  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentFormSchema),
    defaultValues: {
      title: "",
      excerpt: "",
      content: "",
      type: "article",
      status: "draft",
      cover_image: "",
      cover_alt: "",
      category_id: null,
      product_id: null,
      tag_ids: [],
      featured: false,
      allow_comments: true,
      meta_title: "",
      meta_description: "",
      meta_keywords: "",
      canonical_url: "",
      enabled: true,
    },
  });

  // ==================== پر کردن فرم در حالت ویرایش ====================
  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || "",
        excerpt: initialData.excerpt || "",
        content: initialData.content || "",
        type: (initialData.type as ContentFormValues["type"]) || "article",
        status: (initialData.status as ContentFormValues["status"]) || "draft",
        cover_image: initialData.cover_image || "",
        cover_alt: initialData.cover_alt || "",
        category_id: initialData.category_id ?? null,
        product_id: initialData.product_id ?? null,
        tag_ids: initialData.tag_ids || [],
        featured: initialData.featured ?? false,
        allow_comments: initialData.allow_comments ?? true,
        meta_title: initialData.meta_title || "",
        meta_description: initialData.meta_description || "",
        meta_keywords: initialData.meta_keywords || "",
        canonical_url: initialData.canonical_url || "",
        enabled: initialData.enabled ?? true,
      });
    }
  }, [initialData, reset]);

  // ==================== ارسال ====================
  const onSubmitForm = async (data: ContentFormValues) => {
    const payload = {
      title: data.title,
      excerpt: data.excerpt || null,
      content: data.content,
      type: data.type,
      status: data.status,
      cover_image: data.cover_image || null,
      cover_alt: data.cover_alt || null,
      category_id: data.category_id,
      product_id: data.product_id,
      tag_ids: data.tag_ids,
      featured: data.featured,
      allow_comments: data.allow_comments,
      meta_title: data.meta_title || null,
      meta_description: data.meta_description || null,
      meta_keywords: data.meta_keywords || null,
      canonical_url: data.canonical_url || null,
      enabled: data.enabled,
    };
    await onSubmit(payload);
  };

  const categories = categoriesData ?? [];
  const tags = tagsData ?? [];

  // ✅ گزینه‌های محصول — از آرایه مستقیم
  const productOptions = useMemo(() => {
    const list = productsData ?? [];
    return list.map((p) => ({
      id: p.id,
      name: p.persian_title || p.name,
    }));
  }, [productsData]);

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ==================== ستون اصلی ==================== */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>محتوای اصلی</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* عنوان */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  عنوان <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="عنوان محتوا..."
                    />
                  )}
                />
                {errors.title && (
                  <p className="text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* خلاصه */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">خلاصه</label>
                <Controller
                  name="excerpt"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="خلاصه‌ی کوتاه برای نمایش در لیست‌ها و SEO..."
                      rows={3}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {(watch("excerpt") || "").length} کاراکتر
                </p>
                {errors.excerpt && (
                  <p className="text-xs text-red-500">
                    {errors.excerpt.message}
                  </p>
                )}
              </div>

              {/* متن محتوا */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">
                  متن محتوا <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="متن کامل محتوا را اینجا بنویسید..."
                      minHeight="400px"
                    />
                  )}
                />
                {errors.content && (
                  <p className="text-xs text-red-500">
                    {errors.content.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ==================== SEO ==================== */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>تنظیمات SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Meta Title</label>
                <Controller
                  name="meta_title"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="عنوان برای موتورهای جستجو"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {(watch("meta_title") || "").length} / 200
                </p>
                {errors.meta_title && (
                  <p className="text-xs text-red-500">
                    {errors.meta_title.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Meta Description</label>
                <Controller
                  name="meta_description"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      value={field.value || ""}
                      onChange={field.onChange}
                      placeholder="توضیحات متا برای موتورهای جستجو..."
                      rows={3}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  {(watch("meta_description") || "").length} / 500
                </p>
                {errors.meta_description && (
                  <p className="text-xs text-red-500">
                    {errors.meta_description.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Meta Keywords</label>
                <Controller
                  name="meta_keywords"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="کلمات کلیدی با کاما جدا شده"
                    />
                  )}
                />
                {errors.meta_keywords && (
                  <p className="text-xs text-red-500">
                    {errors.meta_keywords.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Canonical URL</label>
                <Controller
                  name="canonical_url"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="https://example.com/..."
                      dir="ltr"
                    />
                  )}
                />
                {errors.canonical_url && (
                  <p className="text-xs text-red-500">
                    {errors.canonical_url.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ==================== ستون کناری ==================== */}
        <div className="space-y-6">
          {/* تنظیمات انتشار */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>تنظیمات انتشار</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">وضعیت</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <SelectInput
                      options={STATUS_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="انتخاب وضعیت"
                      className="w-full"
                      valueKey="id"
                      labelKey="name"
                    />
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">نوع محتوا</label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <SelectInput
                      options={TYPE_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="انتخاب نوع"
                      className="w-full"
                      valueKey="id"
                      labelKey="name"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <label className="text-sm font-medium cursor-pointer">
                    فعال
                  </label>
                  <p className="text-xs text-muted-foreground">
                    نمایش در سایت
                  </p>
                </div>
                <Controller
                  name="enabled"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <label className="text-sm font-medium cursor-pointer">
                    ویژه
                  </label>
                  <p className="text-xs text-muted-foreground">
                    نمایش در بخش ویژه
                  </p>
                </div>
                <Controller
                  name="featured"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                    />
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <div>
                  <label className="text-sm font-medium cursor-pointer">
                    اجازه ثبت نظر
                  </label>
                  <p className="text-xs text-muted-foreground">
                    کاربران بتوانند نظر بدهند
                  </p>
                </div>
                <Controller
                  name="allow_comments"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                    />
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* تصویر شاخص */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>تصویر شاخص</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Controller
                name="cover_image"
                control={control}
                render={({ field }) => (
                  <ImageUploader
                    multiple={false}
                    maxFiles={1}
                    value={field.value ? [field.value] : []}
                    onChange={(urls) => field.onChange(urls[0] ?? "")}
                    folder="contents"
                  />
                )}
              />

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs font-medium">
                  متن جایگزین تصویر (Alt)
                </label>
                <Controller
                  name="cover_alt"
                  control={control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      placeholder="توضیح کوتاه تصویر"
                    />
                  )}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                یک تصویر برای نمایش در لیست‌ها و شبکه‌های اجتماعی
              </p>
              {errors.cover_image && (
                <p className="text-xs text-red-500">
                  {errors.cover_image.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* ✅ محصول مرتبط */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>محصول مرتبط</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="product_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={[
                      { id: 0, name: "بدون محصول" },
                      ...productOptions,
                    ]}
                    value={field.value ? String(field.value) : "0"}
                    onChange={(v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      const num = val ? Number(val) : 0;
                      field.onChange(num === 0 ? null : num);
                    }}
                    placeholder="انتخاب محصول"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />

              {productsLoading && (
                <p className="text-xs text-muted-foreground mt-2">
                  در حال بارگذاری محصولات...
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                با انتخاب محصول، ویژگی‌های آن به‌طور خودکار در صفحه‌ی محتوا
                نمایش داده می‌شود.
              </p>

              {errors.product_id && (
                <p className="text-xs text-red-500 mt-2">
                  {errors.product_id.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* دسته‌بندی */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>دسته‌بندی</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={[
                      { id: 0, name: "بدون دسته‌بندی" },
                      ...categories,
                    ]}
                    value={field.value ? String(field.value) : "0"}
                    onChange={(v) => {
                      const val = Array.isArray(v) ? v[0] : v;
                      const num = val ? Number(val) : 0;
                      field.onChange(num === 0 ? null : num);
                    }}
                    placeholder="انتخاب دسته‌بندی"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
              {categoriesLoading && (
                <p className="text-xs text-muted-foreground mt-2">
                  در حال بارگذاری دسته‌بندی‌ها...
                </p>
              )}
            </CardContent>
          </Card>

          {/* تگ‌ها */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>تگ‌ها</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="tag_ids"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={tags}
                    value={field.value.map(String)}
                    onChange={(val) => {
                      const selected = Array.isArray(val) ? val : [];
                      field.onChange(selected.map(Number));
                    }}
                    isMulti
                    placeholder="انتخاب تگ‌ها"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
              {tagsLoading && (
                <p className="text-xs text-muted-foreground mt-2">
                  در حال بارگذاری تگ‌ها...
                </p>
              )}
              {errors.tag_ids && (
                <p className="text-xs text-red-500 mt-2">
                  {errors.tag_ids.message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* دکمه‌ها */}
      <div className="flex justify-end gap-2">
        <AppButton type="button" variant="red" onClick={() => router.back()}>
          انصراف
        </AppButton>
        <AppButton type="submit" variant="blue" loading={isSubmitting}>
          {isEdit ? "ذخیره تغییرات" : "ایجاد محتوا"}
        </AppButton>
      </div>
    </form>
  );
}