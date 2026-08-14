"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/DataTable";
import {
  Loader2,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApi";
import { formatNumberToPersian } from "@/lib/format";

type SortKey = "id" | "customer" | "date" | "amount" | "status";

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  "تکمیل شده": "default",
  "در حال پردازش": "secondary",
  "ارسال شده": "outline",
  "لغو شده": "destructive",
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = Number(searchParams.get("page")) || 1;
  const initialLimit = Number(searchParams.get("limit")) || 10;
  const initialSortBy = (searchParams.get("sortBy") as SortKey) || "id";
  const initialSortOrder =
    (searchParams.get("sortOrder") as "asc" | "desc") || "asc";

  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [sortBy, setSortBy] = useState<SortKey>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialSortOrder);

  // آمار کلی داشبورد
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useApiQuery<{
    totalUsers: number;
    activeUsers: number;
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    revenue: number;
    growthPercent: number;
  }>("/dashboard/stats", ["dashboard-stats"]);

  // سفارشات اخیر
  const {
    data: ordersData,
    isLoading: ordersLoading,
    error: ordersError,
  } = useApiQuery<{
    orders: any[];
    totalOrders: number;
  }>(
    "/dashboard/orders",
    ["dashboard-orders"],
    {
      page,
      limit,
      sortBy,
      sortOrder,
    }
  );

  // همگام‌سازی URL
  const updateURL = useCallback(
    (p: number, l: number, sb: SortKey, so: string) => {
      const params = new URLSearchParams();
      if (p > 1) params.set("page", p.toString());
      if (l !== 10) params.set("limit", l.toString());
      if (sb !== "id") params.set("sortBy", sb);
      if (so !== "asc") params.set("sortOrder", so);
      const qs = params.toString();
      router.replace(`/dashboard${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    updateURL(page, limit, sortBy, sortOrder);
  }, [page, limit, sortBy, sortOrder, updateURL]);

  const isLoading = statsLoading || ordersLoading;
  const error = statsError || ordersError;

  const columns = [
    { key: "id", title: "شماره سفارش", sortable: true },
    { key: "customer", title: "مشتری", sortable: true },
    { key: "date", title: "تاریخ", sortable: true },
    {
      key: "amount",
      title: "مبلغ",
      sortable: true,
      render: (row: any) => formatNumberToPersian(row.amount) + " تومان",
    },
    {
      key: "status",
      title: "وضعیت",
      sortable: true,
      render: (row: any) => (
        <Badge variant={statusVariantMap[row.status] || "default"}>
          {row.status}
        </Badge>
      ),
    },
  ];

  if (isLoading && !statsData && !ordersData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-red-500">
        خطا در بارگذاری اطلاعات
      </div>
    );
  }

  const stats = statsData;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">داشبورد</h1>

      {/* کارت‌های آماری */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                کل کاربران
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumberToPersian(stats.totalUsers)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumberToPersian(stats.activeUsers)} کاربر فعال
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                محصولات
              </CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumberToPersian(stats.totalProducts)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                تعداد کل کالاها
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                سفارش‌ها
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumberToPersian(stats.totalOrders)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatNumberToPersian(stats.pendingOrders)} سفارش در انتظار
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                درآمد کل
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatNumberToPersian(stats.revenue)} تومان
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="inline h-3 w-3 mr-1 text-green-600" />
                {formatNumberToPersian(stats.growthPercent)}% رشد نسبت به ماه قبل
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* جدول سفارش‌ها */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            آخرین سفارش‌ها
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          {ordersData ? (
            <DataTable
              columns={columns}
              data={ordersData.orders}
              totalCount={ordersData.totalOrders}
              pageSize={limit}
              currentPage={page}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setLimit(size);
                setPage(1);
              }}
              onSort={(key, order) => {
                setSortBy(key as SortKey);
                setSortOrder(order);
                setPage(1);
              }}
              sortKey={sortBy}
              sortOrder={sortOrder}
              isLoading={ordersLoading}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}