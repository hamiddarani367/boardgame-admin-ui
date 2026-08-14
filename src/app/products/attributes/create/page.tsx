"use client";

import { useRouter } from "next/navigation";
import { AttributeForm } from "@/components/forms/AttributeForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/useApi";

export default function CreateAttributePage() {
  const router = useRouter();
  const createAttribute = useApiMutation<any, any>("/attributes", "POST", ["attributes"]);

  const handleCreate = async (data: any) => {
    try {
      await createAttribute.mutateAsync(data);
      router.push("/attributes");
    } catch (error: any) {
      alert(error.message || "خطا در ایجاد ویژگی");
    }
  };

  return (
    <div className="space-y-6">
      <AttributeForm onSubmit={handleCreate} />
    </div>
  );
}