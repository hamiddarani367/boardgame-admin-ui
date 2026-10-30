"use client";

import { useParams, useRouter } from "next/navigation";
import { ProductForm } from "@/components/forms/ProductForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

// تایپ payload ارسالی
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

// تایپ داده دریافتی از API برای ویرایش
interface Product {
  id: number;
  name: string;
  persian_title?: string;
  description?: string;
  full_description?: string;
  price: number;
  discounted_price?: number | null;
  category_id: number;
  image?: string;
  images: string[];
  tags: string[];
  stock_count: number;
  enabled: boolean;
  attribute_values?: ProductSubmitData["attribute_values"];
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const {
    data: productData,
    isLoading,
    error,
  } = useApiQuery<Product>(`/admin/products/${productId}`, ["product", productId]);

  const updateProduct = useApiMutation<unknown, ProductSubmitData>(
    `/admin/products/${productId}`,
    "PUT",
    ["products"]
  );

  const handleUpdate = async (data: ProductSubmitData) => {
    try {
      await updateProduct.mutateAsync(data);
      toast.success("محصول با موفقیت ویرایش شد");
      router.push("/products");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش محصول");
      } else {
        toast.error("خطا در ویرایش محصول");
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

  if (error || !productData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <ProductForm
        initialData={productData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}