"use client";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { usePathname } from "next/navigation";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  // اگر صفحه لاگین بود، فقط children را برگردان (بدون سایدبار و نوبار)
  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }
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