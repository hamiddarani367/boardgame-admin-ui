"use client";

import { useParams, useRouter } from "next/navigation";
import { AttributeForm } from "@/components/forms/AttributeForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface Attribute {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  enabled: boolean;
}

export default function EditAttributePage() {
  const params = useParams();
  const router = useRouter();
  const attributeId = params.id as string;

  const {
    data: attributeData,
    isLoading,
    error,
  } = useApiQuery<Attribute>(`/admin/attributes/${attributeId}`, ["attribute", attributeId]);

  const updateAttribute = useApiMutation<
    unknown,
    {
      name?: string;
      description?: string | null;
      icon?: string | null;
      enabled?: boolean;
    }
  >(`/admin/attributes/${attributeId}`, "PUT", ["attributes"]);

  const handleUpdate = async (data: {
    name: string;
    description: string | null;
    icon: string | null;
    enabled: boolean;
  }) => {
    try {
      await updateAttribute.mutateAsync(data);
      toast.success("ویژگی با موفقیت ویرایش شد");
      router.push("/products/attributes");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش ویژگی");
      } else {
        toast.error("خطا در ویرایش ویژگی");
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

  if (error || !attributeData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <AttributeForm
        initialData={attributeData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}