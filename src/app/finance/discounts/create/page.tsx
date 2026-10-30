"use client";

import { useRouter } from "next/navigation";
import { DiscountForm, type DiscountPayload } from "@/components/forms/DiscountForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateDiscountPage() {
  const router = useRouter();

  const createDiscount = useApiMutation<unknown, DiscountPayload>(
    "/admin/discounts",
    "POST",
    ["discounts"]
  );

  const handleCreate = async (data: DiscountPayload) => {
    try {
      await createDiscount.mutateAsync(data);
      toast.success("تخفیف با موفقیت ایجاد شد");
      router.push("/finance/discounts");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد تخفیف");
      } else {
        toast.error("خطا در ایجاد تخفیف");
      }
    }
  };

  return (
    <div className="space-y-6">
      <DiscountForm onSubmit={handleCreate} />
    </div>
  );
}