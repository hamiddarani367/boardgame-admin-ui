"use client";

import { useParams, useRouter } from "next/navigation";
import { DiscountForm, type DiscountPayload } from "@/components/forms/DiscountForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function EditDiscountPage() {
  const params = useParams();
  const router = useRouter();
  const discountId = params.id as string;

  const {
    data: discountData,
    isLoading,
    error,
  } = useApiQuery<DiscountPayload>(`/admin/discounts/${discountId}`, ["discount", discountId]);

  const updateDiscount = useApiMutation<unknown, DiscountPayload>(
    `/admin/discounts/${discountId}`,
    "PUT",
    ["discounts"]
  );

  const handleUpdate = async (data: DiscountPayload) => {
    try {
      await updateDiscount.mutateAsync(data);
      toast.success("تخفیف با موفقیت ویرایش شد");
      router.push("/finance/discounts");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش تخفیف");
      } else {
        toast.error("خطا در ویرایش تخفیف");
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

  if (error || !discountData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <DiscountForm
        initialData={discountData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}