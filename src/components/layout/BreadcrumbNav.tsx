"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home, ChevronLeft } from "lucide-react";

const labelMap: Record<string, string> = {
  dashboard: "داشبورد",
  users: "کاربران",
  permissions: "دسترسی‌ها",
  roles: "نقش‌ها",
  addresses: "آدرس‌ها",
  products: "محصولات",
  categories: "دسته‌بندی‌ها",
  attributes: "ویژگی‌ها",
  orders: "سفارشات",
  finance: "مالی",
  payments: "پرداخت‌ها",
  transactions: "تراکنش‌ها",
  discounts: "تخفیف‌ها",
  shipping: "حمل‌ونقل",
  reports: "گزارش‌ها",
  messages: "پیام‌ها",
  settings: "تنظیمات",
  create: "ایجاد",
  edit: "ویرایش",
};

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {/* خانه */}
        <BreadcrumbItem>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <Home className="h-4 w-4" />
            خانه
          </Link>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const isLast = index === segments.length - 1;
          const label = labelMap[segment] || segment;

          return (
            <React.Fragment key={segment}>
              {/* جداکننده به‌عنوان همسایه، نه فرزند */}
              <BreadcrumbSeparator>
                <ChevronLeft className="h-4 w-4" />
              </BreadcrumbSeparator>

              {/* آیتم مسیر */}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <Link
                    href={href}
                    className="transition-colors hover:text-foreground"
                  >
                    {label}
                  </Link>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}