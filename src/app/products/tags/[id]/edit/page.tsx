"use client";

import { useParams, useRouter } from "next/navigation";
import { TagForm } from "@/components/forms/TagForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";

interface Tag {
  id: number;
  name: string;
  enabled: boolean;
}

interface TagSubmitData {
  name: string;
  enabled: boolean;
}

export default function EditTagPage() {
  const params = useParams();
  const router = useRouter();
  const tagId = params.id as string;

  const {
    data: tagData,
    isLoading,
    error,
  } = useApiQuery<Tag>(`/admin/tags/${tagId}`, ["tag", tagId]);

  const updateTag = useApiMutation<unknown, TagSubmitData>(
    `/admin/tags/${tagId}`,
    "PUT",
    ["tags"]
  );

  const handleUpdate = async (data: TagSubmitData) => {
    try {
      await updateTag.mutateAsync(data);
      toast.success("تگ با موفقیت ویرایش شد");
      router.push("/products/tags");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش تگ");
      } else {
        toast.error("خطا در ویرایش تگ");
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

  if (error || !tagData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <TagForm
        initialData={tagData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}