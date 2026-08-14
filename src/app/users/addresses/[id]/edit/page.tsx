"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { AddressForm } from "@/components/forms/AddressForm";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function EditAddressPage() {
  const params = useParams();
  const router = useRouter();
  const addressId = params.id as string;

  const { data: addressData, isLoading, error } = useApiQuery<any>(
    `/addresses/${addressId}`,
    ["address", addressId]
  );

  const updateAddress = useApiMutation(
    `/addresses/${addressId}`,
    "PUT",
    ["addresses"]
  );

  const handleUpdate = async (data: any) => {
    try {
      await updateAddress.mutateAsync(data);
      toast.success("آدرس با موفقیت ویرایش شد");
      router.push("/users/addresses");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ویرایش آدرس");
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
      <h1 className="text-2xl font-bold">ویرایش آدرس</h1>
      <AddressForm
        initialData={addressData?.address}
        isEdit
        onSubmit={handleUpdate}
      />
    </div>
  );
}