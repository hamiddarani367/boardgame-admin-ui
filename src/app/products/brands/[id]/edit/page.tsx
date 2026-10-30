"use client";

import { useParams, useRouter } from "next/navigation";
import { BrandForm } from "@/components/forms/BrandForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface Brand {
  id: number;
  name: string;
  description?: string;
  enabled: boolean;
}

export default function EditBrandPage() {
  const params = useParams();
  const router = useRouter();
  const brandId = params.id as string;

  const {
    data: brandData,
    isLoading,
    error,
  } = useApiQuery<Brand>(`/admin/brands/${brandId}`, ["brand", brandId]);

  const updateBrand = useApiMutation<
    unknown,
    {
      name?: string;
      description?: string | null;
      enabled?: boolean;
    }
  >(`/admin/brands/${brandId}`, "PUT", ["brands"]);

  const handleUpdate = async (data: {
    name: string;
    description: string | null;
    enabled: boolean;
  }) => {
    try {
      await updateBrand.mutateAsync(data);
      toast.success("برند با موفقیت ویرایش شد");
      router.push("/products/brands");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش برند");
      } else {
        toast.error("خطا در ویرایش برند");
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

  if (error || !brandData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <BrandForm
        initialData={brandData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}