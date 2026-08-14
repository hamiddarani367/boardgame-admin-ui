"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserForm } from "@/components/forms/UserForm";
import { ImageUploader } from "@/components/shared/ImageUploader";

export default function CreateUserPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);

  // بعداً تابع آپلود واقعی را به‌جای onUpload پاس دهید
  const handleCreate = async (data: any) => {
    console.log("Form data:", data);
    console.log("Images:", images); // اینجا آرایه URL ها را دارید
    // await fetch("/api/users", { method: "POST", body: JSON.stringify({ ...data, images }) });
    router.push("/users");
  };

  return (
    <div className="space-y-6">
      <UserForm onSubmit={handleCreate} />
    </div>
  );
}