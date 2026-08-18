"use client";

import { useRouter } from "next/navigation";
import { RoleForm } from "@/components/forms/RoleForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateRolePage() {
  const router = useRouter();
  const createRole = useApiMutation<unknown, { name: string; permission_ids: number[] }>(
    "/roles",
    "POST",
    ["roles"]
  );

  const handleCreate = async (data: { name: string; permission_ids: number[] }) => {
    try {
      await createRole.mutateAsync(data);
      toast.success("نقش با موفقیت ایجاد شد");
      router.push("/users/roles");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد نقش");
      } else {
        toast.error("خطا در ایجاد نقش");
      }
    }
  };

  return (
    <div className="space-y-6">
      <RoleForm onSubmit={handleCreate} />
    </div>
  );
}