"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleCreate = async (data: any) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "خطا در ایجاد محصول");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.refetchQueries({ queryKey: ["products"] });
    router.push("/products");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <ProductForm onSubmit={handleCreate} />
    </div>
  );
}