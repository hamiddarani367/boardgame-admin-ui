"use client";

import { useParams, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ArrowRight, Loader2 } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { ContentForm } from "@/components/forms/ContentForm";

// ==================== تایپ‌ها (مطابق DTO) ====================

interface ContentAuthorSummary {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  image?: string;
}

interface ContentCategorySummary {
  id: number;
  name: string;
  slug: string;
}

interface ContentTagSummary {
  id: number;
  name: string;
  slug: string;
}

// ✅ مطابق ContentDetailResponse در DTO
interface ContentDetail {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  type: string;
  status: string;
  cover_image?: string;
  cover_alt?: string;
  author?: ContentAuthorSummary;
  category?: ContentCategorySummary;
  tags?: ContentTagSummary[];
  view_count: number;
  like_count: number;
  reading_time: number;
  is_featured: boolean;
  featured: boolean;
  enabled: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;

  // فیلدهای ContentDetailResponse
  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  allow_comments: boolean;
  expires_at?: string;
}

// ✅ مطابق UpdateContentRequest در DTO
interface UpdateContentPayload {
  title: string;
  excerpt: string | null;
  content: string;
  type: string;
  status: string;
  cover_image: string | null;
  cover_alt: string | null;
  category_id: number | null;
  tag_ids: number[];
  featured: boolean;
  allow_comments: boolean;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  canonical_url: string | null;
  enabled: boolean;
}

// ==================== کامپوننت ====================
export default function EditContentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = Number(params.id);

  // ==================== دریافت محتوا ====================
  const { data, isLoading, isError } = useApiQuery<ContentDetail>(
    `/admin/contents/${contentId}`,
    ["content-detail", params.id]
  );

  // ==================== Mutation ====================
  const updateMutation = useApiMutation<unknown, UpdateContentPayload>(
    `/admin/contents/${contentId}`,
    "PUT",
    ["contents", "content-detail"]
  );

  // ==================== ارسال ====================
  const handleSubmit = async (formData: UpdateContentPayload) => {
    try {
      await updateMutation.mutateAsync(formData);
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      queryClient.invalidateQueries({
        queryKey: ["content-detail", params.id],
      });
      toast.success("تغییرات با موفقیت ذخیره شد");
      router.push("/content");
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در ذخیره تغییرات");
      } else {
        toast.error("خطا در ذخیره تغییرات");
      }
      throw error;
    }
  };

  // ==================== Loading ====================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ==================== Error ====================
  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">محتوا یافت نشد</p>
        <AppButton variant="ghost" onClick={() => router.push("/content")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به لیست
        </AppButton>
      </div>
    );
  }

  // ==================== آماده‌سازی initialData ====================
  // ✅ مپ کردن فیلدهای DTO به ساختار فرم
  const initialData = {
    id: data.id,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content, // ← DTO: content
    type: data.type,
    status: data.status,
    cover_image: data.cover_image, // ← DTO: cover_image
    cover_alt: data.cover_alt,
    category_id: data.category?.id ?? null, // ← DTO: category.id (نه category_id)
    tag_ids: data.tags?.map((t) => t.id) ?? [],
    featured: data.featured,
    allow_comments: data.allow_comments,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    meta_keywords: data.meta_keywords,
    canonical_url: data.canonical_url,
    enabled: data.enabled,
  };

  return (
    <div className="space-y-6">
      {/* هدر */}
      <div className="flex items-center gap-3">
        <AppButton
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => router.push("/content")}
          title="بازگشت"
        >
          <ArrowRight className="h-5 w-5" />
        </AppButton>
        <div>
          <h1 className="text-2xl font-bold">ویرایش محتوا</h1>
          <p className="text-sm text-gray-500 mt-1">{data.title}</p>
        </div>
      </div>

      {/* فرم */}
      <ContentForm isEdit initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
}