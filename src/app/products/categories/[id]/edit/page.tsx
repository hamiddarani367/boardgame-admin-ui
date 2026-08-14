"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EditCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const categoryId = params.id as string;

  const [categoryData, setCategoryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const res = await fetch(`/api/categories/${categoryId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("دسته‌بندی یافت نشد");
        const data = await res.json();
        setCategoryData(data.category);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [categoryId]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/categories/${categoryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "خطا در ویرایش دسته‌بندی");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.refetchQueries({ queryKey: ["categories"] });
    router.push("/products/categories");
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryForm initialData={categoryData} isEdit onSubmit={handleUpdate} />
    </div>
  );
}