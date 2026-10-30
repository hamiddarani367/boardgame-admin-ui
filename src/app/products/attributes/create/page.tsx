"use client";

import { useRouter } from "next/navigation";
import { AttributeForm } from "@/components/forms/AttributeForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateAttributePage() {
  const router = useRouter();

  const createAttribute = useApiMutation<
    unknown,
    {
      name: string;
      description: string | null;
      icon: string | null;
      enabled: boolean;
    }
  >("/admin/attributes", "POST", ["attributes"]);

  const handleCreate = async (data: {
    name: string;
    description: string | null;
    icon: string | null;
    enabled: boolean;
  }) => {
    try {
      await createAttribute.mutateAsync(data);
      toast.success("ویژگی با موفقیت ایجاد شد");
      router.push("/products/attributes");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد ویژگی");
      } else {
        toast.error("خطا در ایجاد ویژگی");
      }
    }
  };

  return (
    <div className="space-y-6">
      <AttributeForm onSubmit={handleCreate} />
    </div>
  );
}