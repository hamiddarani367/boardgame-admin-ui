"use client";

import { useParams } from "next/navigation";
import { AddressForm, type AddressInitialData } from "@/components/forms/AddressForm";
import { useApiQuery } from "@/hooks/useApi";
import { Loader2 } from "lucide-react";

export default function EditAddressPage() {
  const params = useParams();
  const addressId = params.id as string;

  const { data: addressData, isLoading, error } = useApiQuery<AddressInitialData>(
    `/admin/addresses/${addressId}`,
    ["address", addressId]
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !addressData) {
    return <div className="text-red-500">خطا در دریافت اطلاعات</div>;
  }

  return (
    <div className="space-y-6">
      <AddressForm initialData={addressData} isEdit />
    </div>
  );
}