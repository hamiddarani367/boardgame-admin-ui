"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Menu,
  ChevronLeft,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  SlidersHorizontal,
  ShoppingCart,
  RotateCcw,
  Users,
  MapPin,
  ShieldCheck,
  KeyRound,
  UserCog,
  CreditCard,
  Receipt,
  Percent,
  Truck,
  BarChart3,
  MessageSquare,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { setMobileSidebarOpen, toggleSidebarCollapsed } from "@/store/slices/uiSlice";
import { useAuth } from "@/hooks/useAuth";

// تایپ آیتم منو با permission
type MenuItem = {
  label: string;
  icon?: React.ElementType;
  path?: string;
  href?: string;
  children?: MenuItem[];
  permission?: string; // ⬅️ مجوز لازم برای نمایش
};

// منوی کامل با فیلد permission برای هر آیتم
const menuItems: MenuItem[] = [
  {
    label: "داشبورد",
    icon: LayoutDashboard,
    href: "/dashboard",
    permission: "dashboard.view",
  },
  {
    label: "محصولات",
    icon: Package,
    path: "/products",
    permission: "products.view",
    children: [
      {
        label: "محصولات",
        icon: ShoppingBag,
        href: "/products",
        permission: "products.view",
      },
      {
        label: "دسته‌بندی‌ها",
        icon: Tags,
        href: "/products/categories",
        permission: "categories.view",
      },
      {
        label: "ویژگی‌ها",
        icon: SlidersHorizontal,
        href: "/products/attributes",
        permission: "attributes.view",
      },
    ],
  },
  {
    label: "سفارشات",
    icon: ShoppingCart,
    path: "/orders",
    permission: "orders.view",
    children: [
      {
        label: "همه سفارشات",
        icon: ShoppingCart,
        href: "/orders",
        permission: "orders.view",
      },
      {
        label: "مرجوعی‌ها",
        icon: RotateCcw,
        href: "/orders/returns",
        permission: "returns.view",
      },
    ],
  },
  {
    label: "کاربران",
    icon: Users,
    path: "/users",
    permission: "users.view",
    children: [
      {
        label: "کاربران",
        icon: Users,
        href: "/users",
        permission: "users.view",
      },
      {
        label: "آدرس‌ها",
        icon: MapPin,
        href: "/users/addresses",
        permission: "addresses.view",
      },
      {
        label: "دسترسی‌ها",
        icon: ShieldCheck,
        path: "/users/permissions",
        permission: "permissions.view",
        children: [
          {
            label: "دسترسی‌ها",
            icon: KeyRound,
            href: "/users/permissions",
            permission: "permissions.view",
          },
          {
            label: "نقش‌ها",
            icon: UserCog,
            href: "/users/permissions/roles",
            permission: "roles.view",
          },
        ],
      },
    ],
  },
  {
    label: "مالی",
    icon: CreditCard,
    path: "/finance",
    permission: "finance.view",
    children: [
      {
        label: "پرداخت‌ها",
        icon: CreditCard,
        href: "/finance/payments",
        permission: "payments.view",
      },
      {
        label: "تراکنش‌ها",
        icon: Receipt,
        href: "/finance/transactions",
        permission: "transactions.view",
      },
      {
        label: "تخفیف‌ها",
        icon: Percent,
        href: "/finance/discounts",
        permission: "discounts.view",
      },
    ],
  },
  {
    label: "حمل‌ونقل",
    icon: Truck,
    href: "/shipping",
    permission: "shipping.view",
  },
  {
    label: "گزارش‌ها",
    icon: BarChart3,
    href: "/reports",
    permission: "reports.view",
  },
  {
    label: "پیام‌ها",
    icon: MessageSquare,
    href: "/messages",
    permission: "messages.view",
  },
  {
    label: "تنظیمات",
    icon: Settings,
    href: "/settings",
    permission: "settings.view",
  },
];

// تابع فیلتر کردن منو بر اساس مجوز
function filterMenuItems(
  items: MenuItem[],
  hasPermission: (permission: string) => boolean
): MenuItem[] {
  return items.reduce((acc, item) => {
    // اگر مجوز دارد و کاربر آن را ندارد، کلاً حذف کن
    if (item.permission && !hasPermission(item.permission)) {
      return acc;
    }

    // اگر زیرمنو دارد، آن را فیلتر کن
    if (item.children) {
      const children = filterMenuItems(item.children, hasPermission);
      if (children.length === 0) return acc;
      return [...acc, { ...item, children }];
    }

    // برگ بدون مجوز یا با مجوز تأیید شده
    return [...acc, item];
  }, [] as MenuItem[]);
}

function SidebarMenuItem({
  item,
  collapsed,
}: {
  item: MenuItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  const isActive = item.href
    ? pathname === item.href
    : item.path
    ? pathname.startsWith(item.path)
    : false;

  const handleCloseMobile = () => {
    dispatch(setMobileSidebarOpen(false));
  };

  // حالت کوچک (فقط آیکون)
  if (collapsed) {
    if (item.href) {
      return (
        <Link
          href={item.href}
          onClick={handleCloseMobile}
          className={cn(
            "flex items-center justify-center h-10 w-full transition-colors",
            isActive
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          )}
          title={item.label}
        >
          {item.icon && <item.icon className="h-5 w-5" />}
        </Link>
      );
    }
    return (
      <button
        onClick={() => dispatch(toggleSidebarCollapsed())}
        className={cn(
          "flex items-center justify-center h-10 w-full transition-colors",
          isActive
            ? "bg-blue-600 text-white"
            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
        )}
        title={item.label}
      >
        {item.icon && <item.icon className="h-5 w-5" />}
      </button>
    );
  }

  // حالت کامل
  if (item.children && item.children.length > 0) {
    return (
      <Collapsible open={open} onOpenChange={setOpen} className="w-full">
        <CollapsibleTrigger
          className={cn(
            "flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer",
            isActive
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
          )}
        >
          <span className="flex items-center gap-3">
            {item.icon && <item.icon className="h-4 w-4" />}
            {item.label}
          </span>
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              open && "-rotate-90"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="w-full">
          {item.children.map((child, idx) => (
            <SidebarMenuItem key={idx} item={child} collapsed={false} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  // برگ (لینک)
  return (
    <Link
      href={item.href || "#"}
      onClick={handleCloseMobile}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-blue-600 text-white"
          : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
      )}
    >
      {item.icon && <item.icon className="h-4 w-4" />}
      {item.label}
    </Link>
  );
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const { sidebarCollapsed, mobileSidebarOpen } = useSelector(
    (state: RootState) => state.ui
  );
  const { hasPermission } = useAuth(); // ✅ دریافت تابع بررسی مجوز

  // فیلتر منو بر اساس دسترسی‌های کاربر
  const visibleMenuItems = filterMenuItems(menuItems, hasPermission);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex h-screen flex-col border-l bg-white transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div
          className={cn(
            "h-14 flex items-center justify-center border-b",
            sidebarCollapsed ? "px-2" : "px-4"
          )}
        >
          {sidebarCollapsed ? (
            <h2 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              BK
            </h2>
          ) : (
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              Board Kingdom
            </h2>
          )}
        </div>
        <nav className="flex flex-col w-full">
          {visibleMenuItems.map((item, idx) => (
            <SidebarMenuItem
              key={idx}
              item={item}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet
        open={mobileSidebarOpen}
        onOpenChange={(open) => dispatch(setMobileSidebarOpen(open))}
      >
        <SheetContent side="right" className="w-64 p-0">
          <div className="h-14 flex items-center justify-center border-b bg-white">
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Board Kingdom
            </h2>
          </div>
          <nav className="flex flex-col w-full">
            {visibleMenuItems.map((item, idx) => (
              <SidebarMenuItem key={idx} item={item} collapsed={false} />
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}