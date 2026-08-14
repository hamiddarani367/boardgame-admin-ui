"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { UserForm } from "@/components/forms/UserForm";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("کاربر یافت نشد");
        const data = await res.json();
        setUserData(data.user);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.error || "خطا در ویرایش");
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["users"] });
    await queryClient.refetchQueries({ queryKey: ["users"] });

    router.push("/users");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">ویرایش کاربر</h1>
      <UserForm initialData={userData} isEdit onSubmit={handleUpdate} />
    </div>
  );
}