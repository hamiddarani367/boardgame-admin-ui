"use client";

import { useRouter } from "next/navigation";
import { AddressForm } from "@/components/forms/AddressForm";
import { useApiMutation } from "@/hooks/useApi";
import { toast } from "sonner";

export default function CreateAddressPage() {
  const router = useRouter();
  const createAddress = useApiMutation("/addresses", "POST", ["addresses"]);

  const handleCreate = async (data: any) => {
    try {
      await createAddress.mutateAsync(data);
      toast.success("آدرس با موفقیت ایجاد شد");
      router.push("/users/addresses");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "خطا در ایجاد آدرس");
    }
  };

  return (
    <div className="space-y-6">
      <AddressForm onSubmit={handleCreate} />
    </div>
  );
}