"use client";

import { useParams, useRouter } from "next/navigation";
import { RoleForm } from "@/components/forms/RoleForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

interface RoleData {
  id: number;
  name: string;
  description?: string;
  enabled?: boolean;
  permission_ids: number[];
}

export default function EditRolePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const roleId = params.id as string;

  // ✅ پاسخ مستقیم RoleData است (بدون { role: ... })
  const { data: role, isLoading, error } = useApiQuery<RoleData>(
    `/admin/roles/${roleId}`,
    ["role", roleId],
    undefined,
    { refetchOnMount: true }
  );

  const updateRole = useApiMutation<unknown, { name: string; permission_ids: number[] }>(
    `/admin/roles/${roleId}`,
    "PUT",
    ["roles"]
  );

  const handleUpdate = async (data: { name: string; permission_ids: number[] }) => {
    try {
      await updateRole.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: ["role", roleId] });
      toast.success("نقش با موفقیت ویرایش شد");
      router.push("/users/roles");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش نقش");
      } else {
        toast.error("خطا در ویرایش نقش");
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

  if (error || !role) {
    return <div className="text-red-500">خطا در دریافت اطلاعات نقش</div>;
  }

  // تبدیل permission_ids به permissions برای RoleForm
  const formInitialData = {
    id: role.id,
    name: role.name || "",
    permissions: role.permission_ids || [],
  };

  return (
    <div className="space-y-6">
      <RoleForm
        initialData={formInitialData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}