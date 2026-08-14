"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productId = params.id as string;

  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("محصول یافت نشد");
        const data = await res.json();
        setProductData(data.product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/products/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "خطا در ویرایش محصول");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.refetchQueries({ queryKey: ["products"] });
    router.push("/products");
    router.refresh();
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
      <h1 className="text-2xl font-bold">ویرایش محصول</h1>
      <ProductForm initialData={productData} isEdit onSubmit={handleUpdate} />
    </div>
  );
}