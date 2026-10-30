"use client";

import { useRouter } from "next/navigation";
import { BrandForm } from "@/components/forms/BrandForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateBrandPage() {
  const router = useRouter();

  const createBrand = useApiMutation<
    unknown,
    {
      name: string;
      description: string | null;
      enabled: boolean;
    }
  >("/admin/brands", "POST", ["brands"]);

  const handleCreate = async (data: {
    name: string;
    description: string | null;
    enabled: boolean;
  }) => {
    try {
      await createBrand.mutateAsync(data);
      toast.success("برند با موفقیت ایجاد شد");
      router.push("/products/brands");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد برند");
      } else {
        toast.error("خطا در ایجاد برند");
      }
    }
  };

  return (
    <div className="space-y-6">
      <BrandForm onSubmit={handleCreate} />
    </div>
  );
}