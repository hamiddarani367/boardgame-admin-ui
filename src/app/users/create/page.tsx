"use client";

import { useRouter } from "next/navigation";
import { UserForm } from "@/components/forms/UserForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";
import { AxiosError } from "axios";

export default function CreateUserPage() {
  const router = useRouter();

  const createUser = useApiMutation<
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
  >("/users", "POST", ["users"]);

  const handleCreate = async (data: {
    first_name: string;
    last_name: string;
    phone: string;
    email: string | null;
    role_ids: number[];
    enabled: boolean;
    image: string | null;
  }) => {
    try {
      console.log(data)
      await createUser.mutateAsync(data);
      toast.success("کاربر با موفقیت ایجاد شد");
      router.push("/users");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ایجاد کاربر");
      } else {
        toast.error("خطا در ایجاد کاربر");
      }
    }
  };

  return (
    <div className="space-y-6">
      <UserForm onSubmit={handleCreate} />
    </div>
  );
}