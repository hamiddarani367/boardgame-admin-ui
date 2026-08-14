"use client";

import { useRouter } from "next/navigation";
import { PaymentGatewayForm } from "@/components/forms/PaymentGatewayForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";

export default function CreatePaymentGatewayPage() {
  const router = useRouter();
  const createGateway = useApiMutation("/finance/gateway", "POST", ["gateways"]);

  const handleCreate = async (data: any) => {
    try {
      await createGateway.mutateAsync(data);
      toast.success("درگاه با موفقیت ایجاد شد");
      router.push("/finance/gateway");   // ✅ اصلاح شد
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ایجاد درگاه");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ایجاد درگاه پرداخت</h1>
      <PaymentGatewayForm onSubmit={handleCreate} />
    </div>
  );
}