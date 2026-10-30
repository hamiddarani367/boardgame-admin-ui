"use client";

import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

// تایپ payload ارسالی (مطابق ProductForm)
interface ProductSubmitData {
  name: string;
  persian_title: string | null;
  description: string | null;
  full_description: string | null;
  price: number;
  discounted_price: number | null;
  category_id: number;
  image: string | null;
  images: string[];
  tags: string[];
  stock_count: number;
  enabled: boolean;
  attribute_values: {
    attribute_id: number;
    value: string;
  }[];
}

export default function CreateProductPage() {
  const router = useRouter();

  const createProduct = useApiMutation<unknown, ProductSubmitData>(
    "/admin/products",
    "POST",
    ["products"]
  );

  const handleCreate = async (data: ProductSubmitData) => {
    try {
      await createProduct.mutateAsync(data);
      toast.success("محصول با موفقیت ایجاد شد");
      router.push("/products");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد محصول");
      } else {
        toast.error("خطا در ایجاد محصول");
      }
    }
  };

  return (
    <div className="space-y-6">
      <ProductForm onSubmit={handleCreate} />
    </div>
  );
}