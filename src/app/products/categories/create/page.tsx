"use client";

import { useRouter } from "next/navigation";
import { CategoryForm } from "@/components/forms/CategoryForm";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateCategoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "خطا در ایجاد دسته‌بندی");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["categories"] });
    await queryClient.refetchQueries({ queryKey: ["categories"] });
    router.push("/products/categories");
  };

  return (
    <div className="space-y-6">
      <CategoryForm onSubmit={handleCreate} />
    </div>
  );
}