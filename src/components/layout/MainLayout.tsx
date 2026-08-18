"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/hooks/useAuth";
import { getRequiredPermission } from "@/config/permissions";
import { Loader2 } from "lucide-react";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <AuthGuard>
      <Content>{children}</Content>
    </AuthGuard>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { hasPermission, isLoading } = useAuth();

  const requiredPermission = getRequiredPermission(pathname);

  // در حال بارگذاری
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // اگر مجوز لازم است و کاربر آن را ندارد
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-6xl font-bold text-red-600">۴۰۳</h1>
        <p className="text-lg text-muted-foreground">شما به این بخش دسترسی ندارید.</p>
      </div>
    );
  }

  // نمایش Layout عادی
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <BreadcrumbNav />
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}