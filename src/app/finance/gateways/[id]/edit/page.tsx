"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PaymentGatewayForm } from "@/components/forms/PaymentGatewayForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditPaymentGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const gatewayId = params.id as string;

  const { data: gatewayData, isLoading, error } = useApiQuery<any>(
    `/finance/gateway/${gatewayId}`,
    ["gateway", gatewayId]
  );

  const updateGateway = useApiMutation(
    `/finance/gateway/${gatewayId}`,
    "PUT",
    ["gateways"]
  );

  const handleUpdate = async (data: any) => {
    try {
      await updateGateway.mutateAsync(data);
      toast.success("درگاه با موفقیت ویرایش شد");
      router.push("/finance/gateway");   
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ویرایش درگاه");
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
      <h1 className="text-2xl font-bold">ویرایش درگاه پرداخت</h1>
      <PaymentGatewayForm
        initialData={gatewayData?.payment_gateway}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}