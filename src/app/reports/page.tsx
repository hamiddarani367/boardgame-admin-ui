"use client";

import { useApiQuery } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, ShoppingCart, DollarSign, Package } from "lucide-react";
import { formatNumberToPersian } from "@/lib/format";

export default function ReportsPage() {
  const { data, isLoading } = useApiQuery<{
    total_users: number;
    total_orders: number;
    total_revenue: number;
    total_products: number;
  }>("/reports/summary", ["reports-summary"]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = data || {
    total_users: 0,
    total_orders: 0,
    total_revenue: 0,
    total_products: 0,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">گزارش‌ها</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل کاربران
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumberToPersian(stats.total_users)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              کل سفارشات
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumberToPersian(stats.total_orders)}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              درآمد کل
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumberToPersian(stats.total_revenue)} تومان
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              تعداد محصولات
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumberToPersian(stats.total_products)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* در آینده می‌توانید نمودار اضافه کنید */}
      <div className="rounded-none border bg-card p-6 text-center text-muted-foreground">
        نمودارهای پیشرفته در نسخه‌های بعدی اضافه خواهند شد.
      </div>
    </div>
  );
}