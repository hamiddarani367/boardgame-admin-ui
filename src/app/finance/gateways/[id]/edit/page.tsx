"use client";

import { useParams, useRouter } from "next/navigation";
import { GatewayForm, type GatewayPayload } from "@/components/forms/GatewayForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function EditGatewayPage() {
  const params = useParams();
  const router = useRouter();
  const gatewayId = params.id as string;

  const {
    data: gatewayData,
    isLoading,
    error,
  } = useApiQuery<GatewayPayload & { id: number }>(
    `/admin/gateways/${gatewayId}`,
    ["gateway", gatewayId]
  );

  const updateGateway = useApiMutation<unknown, GatewayPayload>(
    `/admin/gateways/${gatewayId}`,
    "PUT",
    ["gateways"]
  );

  const handleUpdate = async (data: GatewayPayload) => {
    try {
      await updateGateway.mutateAsync(data);
      toast.success("درگاه با موفقیت ویرایش شد");
      router.push("/finance/gateways");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش درگاه");
      } else {
        toast.error("خطا در ویرایش درگاه");
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

  if (error || !gatewayData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <GatewayForm
        initialData={gatewayData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}