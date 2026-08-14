"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DiscountForm } from "@/components/forms/DiscountForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const discountId = params.id as string;

  const { data: discountData, isLoading, error } = useApiQuery<any>(
    `/finance/discounts/${discountId}`,
    ["discount", discountId]
  );

  const updateDiscount = useApiMutation(
    `/finance/discounts/${discountId}`,
    "PUT",
    ["discounts"]
  );

  const handleUpdate = async (data: any) => {
    try {
      await updateDiscount.mutateAsync(data);
      toast.success("تخفیف با موفقیت ویرایش شد");
      router.push("/finance/discounts");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ویرایش تخفیف");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ویرایش تخفیف</h1>
      <DiscountForm
        initialData={discountData?.discount}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}