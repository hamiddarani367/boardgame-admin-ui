// src/app/attributes/[id]/edit/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AttributeForm } from "@/components/forms/AttributeForm";
import { useApiMutation, useApiQuery } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

export default function EditAttributePage() {
  const params = useParams();
  const router = useRouter();
  const attributeId = params.id as string;

  const { data: attributeData, isLoading, error } = useApiQuery<any>(
    `/attributes/${attributeId}`,
    ["attribute", attributeId]
  );

  const updateAttribute = useApiMutation<any, any>(
    `/attributes/${attributeId}`,
    "PUT",
    ["attributes"]
  );

  const handleUpdate = async (data: any) => {
    try {
      await updateAttribute.mutateAsync(data);
      router.push("/attributes");
    } catch (error: any) {
      alert(error.message || "خطا در ویرایش ویژگی");
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
      <AttributeForm initialData={attributeData?.attribute} isEdit onSubmit={handleUpdate} />
    </div>
  );
}