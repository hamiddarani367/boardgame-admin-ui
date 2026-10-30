"use client";

import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateCategoryPage() {
  const router = useRouter();

  const createCategory = useApiMutation<
    unknown,
    {
      name: string;
      icon: string | null;
      color: string | null;
      light_bg: string | null;
      light_text: string | null;
      attribute_ids: number[];
    }
  >("/admin/categories", "POST", ["categories"]);

  const handleCreate = async (data: {
    name: string;
    icon: string | null;
    color: string | null;
    light_bg: string | null;
    light_text: string | null;
    attribute_ids: number[];
  }) => {
    try {
      await createCategory.mutateAsync(data);
      toast.success("دسته‌بندی با موفقیت ایجاد شد");
      router.push("/products/categories");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد دسته‌بندی");
      } else {
        toast.error("خطا در ایجاد دسته‌بندی");
      }
    }
  };

  return (
    <div className="space-y-6">
      <CategoryForm onSubmit={handleCreate} />
    </div>
  );
}