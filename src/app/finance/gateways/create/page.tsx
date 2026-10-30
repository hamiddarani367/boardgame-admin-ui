"use client";

import { useRouter } from "next/navigation";
import { GatewayForm, type GatewayPayload } from "@/components/forms/GatewayForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateGatewayPage() {
  const router = useRouter();

  const createGateway = useApiMutation<unknown, GatewayPayload>(
    "/admin/gateways",
    "POST",
    ["gateways"]
  );

  const handleCreate = async (data: GatewayPayload) => {
    try {
      await createGateway.mutateAsync(data);
      toast.success("درگاه با موفقیت ایجاد شد");
      router.push("/finance/gateways");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد درگاه");
      } else {
        toast.error("خطا در ایجاد درگاه");
      }
    }
  };

  return (
    <div className="space-y-6">
      <GatewayForm onSubmit={handleCreate} />
    </div>
  );
}