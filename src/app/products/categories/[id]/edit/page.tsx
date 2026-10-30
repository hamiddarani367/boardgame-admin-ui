"use client";

import { useParams, useRouter } from "next/navigation";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  light_bg?: string;
  light_text?: string;
  attribute_ids: number[];
}

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const {
    data: categoryData,
    isLoading,
    error,
  } = useApiQuery<Category>(`/admin/categories/${categoryId}`, ["category", categoryId]);

  const updateCategory = useApiMutation<
    unknown,
    {
      name?: string;
      icon?: string | null;
      color?: string | null;
      light_bg?: string | null;
      light_text?: string | null;
      attribute_ids?: number[];
    }
  >(`/admin/categories/${categoryId}`, "PUT", ["categories"]);

  const handleUpdate = async (data: {
    name: string;
    icon: string | null;
    color: string | null;
    light_bg: string | null;
    light_text: string | null;
    attribute_ids: number[];
  }) => {
    try {
      await updateCategory.mutateAsync(data);
      toast.success("دسته‌بندی با موفقیت ویرایش شد");
      router.push("/products/categories");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش دسته‌بندی");
      } else {
        toast.error("خطا در ویرایش دسته‌بندی");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !categoryData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <CategoryForm
        initialData={categoryData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}