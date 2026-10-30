"use client";

import { useRouter } from "next/navigation";
import { TagForm } from "@/components/forms/TagForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface TagSubmitData {
  name: string;
  enabled: boolean;
}

export default function CreateTagPage() {
  const router = useRouter();

  const createTag = useApiMutation<unknown, TagSubmitData>(
    "/admin/tags",
    "POST",
    ["tags"]
  );

  const handleCreate = async (data: TagSubmitData) => {
    try {
      await createTag.mutateAsync(data);
      toast.success("تگ با موفقیت ایجاد شد");
      router.push("/products/tags");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد تگ");
      } else {
        toast.error("خطا در ایجاد تگ");
      }
    }
  };

  return (
    <div className="space-y-6">
      <TagForm onSubmit={handleCreate} />
    </div>
  );
}