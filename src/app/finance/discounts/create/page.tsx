"use client";

import { useRouter } from "next/navigation";
import { DiscountForm } from "@/components/forms/DiscountForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";

export default function CreateDiscountPage() {
  const router = useRouter();
  const createDiscount = useApiMutation("/finance/discounts", "POST", ["discounts"]);

  const handleCreate = async (data: any) => {
    try {
      await createDiscount.mutateAsync(data);
      toast.success("تخفیف با موفقیت ایجاد شد");
      router.push("/finance/discounts");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ایجاد تخفیف");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ایجاد تخفیف</h1>
      <DiscountForm onSubmit={handleCreate} />
    </div>
  );
}