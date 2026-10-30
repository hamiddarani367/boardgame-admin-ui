"use client";

import { useRouter } from "next/navigation";
import { useApiMutation } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { ArrowRight } from "lucide-react";
import { AppButton } from "@/components/shared/AppButton";
import { ContentForm } from "@/components/forms/ContentForm";

// ==================== تایپ‌ها (مطابق DTO) ====================
interface CreateContentPayload {
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

interface ContentResponse {
  id: number;
}

// ==================== کامپوننت ====================
export default function CreateContentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useApiMutation<ContentResponse, CreateContentPayload>(
    "/admin/contents",
    "POST",
    ["contents"]
  );

  const handleSubmit = async (data: CreateContentPayload) => {
    try {
      const created = await createMutation.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      toast.success("محتوا با موفقیت ایجاد شد");

      // ✅ بهتره به صفحه‌ی detail محتوای جدید بره (اگه id برگرده)
      if (created?.id) {
        router.push(`/content/${created.id}`);
      } else {
        router.push("/content");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در ایجاد محتوا");
      } else {
        toast.error("خطا در ایجاد محتوا");
      }
      // ✅ خطا رو throw کن تا isSubmitting فرم ریست نشه
      throw error;
    }
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
        <h1 className="text-2xl font-bold">محتوای جدید</h1>
      </div>

      {/* فرم */}
      <ContentForm isEdit={false} onSubmit={handleSubmit} />
    </div>
  );
}