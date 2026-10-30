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
  LayoutDashboard,
  Package,
  ShoppingBag,
  Tags,
  Award,
  Tag,
  SlidersHorizontal,
  ShoppingCart,
  Clock,
  Truck,
  Users,
  MapPin,
  ShieldCheck,
  KeyRound,
  UserCog,
  Warehouse,
  Boxes,
  AlertTriangle,
  History,
  PackageCheck,
  MessageCircle,
  Receipt,
  Percent,
  CreditCard,
  Wallet,
  RotateCcw,
  BarChart3,
  TrendingUp,
  DollarSign,
  Bell,
  Send,
  MessageSquare,
  Images,
  ScrollText,
  Settings,
  FileText,
  Image,
  UserCheck,
  LogIn,
  Headphones,
  Megaphone,
  ChevronLeft,
  FileEdit,
  FolderTree,
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
  permission?: string;
};

// منوی کامل با فیلد permission برای هر آیتم
const menuItems: MenuItem[] = [
  // ============================================================
  // ==================== داشبورد ====================
  // ============================================================
  {
    label: "داشبورد",
    icon: LayoutDashboard,
    href: "/dashboard",
    permission: "dashboard.view",
  },

  // ============================================================
  // ==================== محصولات ====================
  // ============================================================
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
        label: "برندها",
        icon: Award,
        href: "/products/brands",
        permission: "brands.view",
      },
      {
        label: "تگ‌ها",
        icon: Tag,
        href: "/products/tags",
        permission: "tags.view",
      },
      {
        label: "ویژگی‌ها",
        icon: SlidersHorizontal,
        href: "/products/attributes",
        permission: "attributes.view",
      },
    ],
  },

  // ============================================================
  // ==================== سفارشات ====================
  // ============================================================
  {
    label: "سفارشات",
    icon: ShoppingCart,
    path: "/orders",
    permission: "orders.view",
    children: [
      {
        label: "سفارشات",
        icon: ShoppingCart,
        href: "/orders",
        permission: "orders.view",
      },
    ],
  },

  // ============================================================
  // ==================== کاربران ====================
  // ============================================================
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
            href: "/users/roles",
            permission: "roles.view",
          },
        ],
      },
    ],
  },

  // ============================================================
  // ==================== انبار ====================
  // ============================================================
  {
    label: "انبار",
    icon: Warehouse,
    path: "/inventory",
    permission: "inventory.view",
    children: [
      {
        label: "موجودی",
        icon: Boxes,
        href: "/inventory/stock",
        permission: "inventory.view",
      },
      {
        label: "هشدار کمبود",
        icon: AlertTriangle,
        href: "/inventory/low-stock",
        permission: "inventory.view",
      },
      {
        label: "تاریخچه انبار",
        icon: History,
        href: "/inventory/history",
        permission: "inventory.view",
      },
    ],
  },

  // ============================================================
  // ==================== نظرات ====================
  // ============================================================
  {
    label: "نظرات",
    icon: MessageCircle,
    path: "/reviews",
    permission: "reviews.view",
    children: [
      {
        label: "نظرات",
        icon: Clock,
        href: "/reviews/pending",
        permission: "reviews.moderate",
      },
    ],
  },

  // ============================================================
  // ==================== مالی ====================
  // ============================================================
  {
    label: "مالی",
    icon: Receipt,
    path: "/finance",
    permission: "finance.view",
    children: [
      {
        label: "تخفیف‌ها",
        icon: Percent,
        href: "/finance/discounts",
        permission: "discounts.view",
      },
      {
        label: "درگاه‌ها",
        icon: CreditCard,
        href: "/finance/gateways",
        permission: "gateways.view",
      },
    ],
  },

  // ============================================================
  // ==================== گزارش‌ها ====================
  // ============================================================
  {
    label: "گزارش‌ها",
    icon: BarChart3,
    path: "/reports",
    permission: "reports.view",
    children: [
      {
        label: "فروش",
        icon: TrendingUp,
        href: "/reports/sales",
        permission: "reports.view",
      },
      {
        label: "مشتریان",
        icon: Users,
        href: "/reports/customers",
        permission: "reports.view",
      },
      {
        label: "محصولات",
        icon: Package,
        href: "/reports/products",
        permission: "reports.view",
      },
      {
        label: "مالی",
        icon: Wallet,
        href: "/reports/finance",
        permission: "reports.view",
      },
      {
        label: "نرخ دلار",
        icon: DollarSign,
        href: "/reports/exchange-rates",
        permission: "exchange_rates.view",
      },
    ],
  },

  // ============================================================
  // ==================== اطلاع‌رسانی ====================
  // ============================================================
  {
    label: "اطلاع‌رسانی",
    icon: Bell,
    path: "/notifications",
    permission: "notifications.view",
    children: [
      {
        label: "ارسال اعلان",
        icon: Send,
        href: "/notifications/send",
        permission: "notifications.send",
      },
      {
        label: "قالب پیامک",
        icon: MessageSquare,
        href: "/notifications/sms-templates",
        permission: "notifications.view",
      },
      {
        label: "تاریخچه اعلان‌ها",
        icon: History,
        href: "/notifications/history",
        permission: "notifications.view",
      },
    ],
  },
// ============================================================
// ==================== محتوا ====================
// ============================================================
  {
    label: "محتوا",
    icon: FileText,
    path: "/content",
    permission: "content.view",
    children: [
      {
        label: "محتواها",
        icon: FileText,
        href: "/content",
        permission: "content.view",
      },
      {
        label: "دسته‌بندی‌ها",
        icon: FolderTree,
        href: "/content/categories",
        permission: "content_categories.view",
      },
      {
        label: "تگ‌ها",
        icon: Tags,
        href: "/content/tags",
        permission: "content_tags.view",
      },
    ],
  },
  // ============================================================
  // ==================== پیام‌ها ====================
  // ============================================================
  {
    label: "پیام‌ها",
    icon: MessageSquare,
    href: "/messages",
    permission: "messages.view",
  },
  // ============================================================
  // ==================== تنظیمات ====================
  // ============================================================
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
    if (item.permission && !hasPermission(item.permission)) {
      return acc;
    }

    if (item.children) {
      const children = filterMenuItems(item.children, hasPermission);
      if (children.length === 0) return acc;
      return [...acc, { ...item, children }];
    }

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
  const { hasPermission } = useAuth();

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