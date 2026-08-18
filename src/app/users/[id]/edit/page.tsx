"use client";

import { useParams, useRouter } from "next/navigation";
import { UserForm } from "@/components/forms/UserForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useQueryClient } from "@tanstack/react-query";

interface UserData {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  role_ids?: number[];
  enabled: boolean;
  image?: string;
}

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const { data: userData, isLoading, error } = useApiQuery<UserData>(
    `/users/${userId}`,
    ["user", userId],
    undefined,
    { refetchOnMount: true }
  );

  const updateUser = useApiMutation<
    unknown,
    {
      first_name: string;
      last_name: string;
      phone: string;
      email: string | null;
      role_ids: number[];
      enabled: boolean;
      image: string | null;
    }
  >(`/users/${userId}`, "PUT", ["users"]);

  const handleUpdate = async (data: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    role_ids: number[];
    enabled: boolean;
    image: string | null;
  }) => {
    try {
      await updateUser.mutateAsync(data);
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success("کاربر با موفقیت ویرایش شد");
      router.push("/users");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ویرایش کاربر");
      } else {
        toast.error("خطا در ویرایش کاربر");
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

  if (error || !userData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات کاربر</div>;
  }

  const formInitialData = {
    id: userData.id,
    first_name: userData.first_name,
    last_name: userData.last_name,
    phone: userData.phone,
    email: userData.email || "",
    role_ids: userData.role_ids || [],
    enabled: userData.enabled,
    image: userData.image || "",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ویرایش کاربر</h1>
      <UserForm
        initialData={formInitialData}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}