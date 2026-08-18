"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface PermissionGuardProps {
  permission: string; // مجوز لازم برای این صفحه
  children: React.ReactNode;
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const router = useRouter();
  const { user, isLoading, hasPermission } = useAuth();

  useEffect(() => {
    if (!isLoading && user && !hasPermission(permission)) {
      // کاربر وارد شده اما مجوز ندارد
      router.replace("/403"); // یا به داشبورد با پیام خطا
    }
  }, [isLoading, user, hasPermission, permission, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || !hasPermission(permission)) {
    return null; // در حین ریدایرکت
  }

  return <>{children}</>;
}