"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/shared/AppButton";
import {
  ArrowRight,
  User,
  MapPin,
  Package,
  Phone,
  Loader2,
  CreditCard,
  ShoppingBag,
  Calendar,
  Hash,
  Truck,
  Tag,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Banknote,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { formatNumberToPersian } from "@/lib/format";
import { toPersianDateTime } from "@/lib/date";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌ها ====================
interface OrderUser {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
}

interface OrderGateway {
  id: number;
  name: string;
  slug: string;
  type: string;
}

interface OrderAddress {
  id: number;
  title: string;
  full_address: string;
  province: string;
  city: string;
  postal_code: string;
}

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  price: number;
  discounted_price: number;
  quantity: number;
  total_price: number;
  savings: number;
}

interface OrderDetail {
  id: number;
  user_id: number;
  user: OrderUser;
  status: string;

  total_amount: number;
  total_savings: number;
  discount_amount: number;
  final_amount: number;

  gateway_id: number;
  gateway: OrderGateway;

  payment_authority: string;
  payment_ref_id: string;

  address_id: number;
  address: OrderAddress;

  items: OrderItem[];

  created_at: string;
  updated_at: string;
}

interface StatusInfo {
  label: string;
  className: string;
  icon: LucideIcon;
}

interface StatusOption {
  value: string;
  label: string;
}

interface UpdateStatusPayload {
  status: string;
}

// ==================== وضعیت‌ها ====================
const statusMap: Record<string, StatusInfo> = {
  cart: {
    label: "سبد خرید",
    className: "bg-gray-100 text-gray-700",
    icon: ShoppingBag,
  },
  pending: {
    label: "در انتظار پرداخت",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  awaiting_cash: {
    label: "در انتظار پرداخت نقدی",
    className: "bg-amber-100 text-amber-700",
    icon: Banknote,
  },
  paid: {
    label: "پرداخت شده",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  shipped: {
    label: "ارسال شده",
    className: "bg-blue-100 text-blue-700",
    icon: Truck,
  },
  delivered: {
    label: "تحویل شده",
    className: "bg-purple-100 text-purple-700",
    icon: CheckCircle,
  },
  canceled: {
    label: "لغو شده",
    className: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  refunded: {
    label: "بازگشت داده شده",
    className: "bg-pink-100 text-pink-700",
    icon: RotateCcw,
  },
};

const statusOptions: StatusOption[] = [
  { value: "pending", label: "در انتظار پرداخت" },
  { value: "awaiting_cash", label: "در انتظار پرداخت نقدی" },
  { value: "paid", label: "پرداخت شده" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل شده" },
  { value: "canceled", label: "لغو شده" },
  { value: "refunded", label: "بازگشت داده شده" },
];

const FALLBACK_STATUS: StatusInfo = {
  label: "نامشخص",
  className: "bg-gray-100 text-gray-700",
  icon: Clock,
};

// ==================== کامپوننت ====================
export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const orderId = params.id;

  const [pendingStatus, setPendingStatus] = useState<string>("");

  const { data, isLoading, isError } = useApiQuery<OrderDetail>(
    `/admin/orders/${orderId}`,
    ["order-detail", orderId]
  );

  const updateStatus = useApiMutation<unknown, UpdateStatusPayload>(
    `/admin/orders/${orderId}/status`,
    "PATCH",
    ["order-detail", orderId]
  );

  // ---------- Loading ----------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ---------- Error ----------
  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">سفارش مورد نظر یافت نشد</p>
        <AppButton
          variant="ghost"
          onClick={() => router.push("/orders")}
          className="mt-4"
        >
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به لیست
        </AppButton>
      </div>
    );
  }

  const order = data;
  const statusInfo: StatusInfo = statusMap[order.status] ?? {
    ...FALLBACK_STATUS,
    label: order.status,
  };
  const StatusIcon = statusInfo.icon;

  const handleStatusChange = async (status: string) => {
    if (status === order.status) return;

    setPendingStatus(status);
    try {
      await updateStatus.mutateAsync({ status });
      queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success(
        `وضعیت سفارش به «${statusMap[status]?.label ?? status}» تغییر یافت`
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در تغییر وضعیت سفارش");
      } else {
        toast.error("خطا در تغییر وضعیت سفارش");
      }
    } finally {
      setPendingStatus("");
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== هدر ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <AppButton
            variant="ghost"
            size="icon"
            onClick={() => router.push("/orders")}
            title="بازگشت"
          >
            <ArrowRight className="h-5 w-5" />
          </AppButton>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Hash className="h-5 w-5 text-gray-400" />
              سفارش {formatNumberToPersian(order.id)}
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {toPersianDateTime(order.created_at)}
            </p>
          </div>
        </div>

        <Badge className={`${statusInfo.className} text-sm px-3 py-1.5`}>
          <StatusIcon className="h-4 w-4 ml-1" />
          {statusInfo.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ==================== ستون اصلی ==================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* ---------- محصولات سفارش ---------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                محصولات سفارش
                <span className="text-sm font-normal text-gray-500 mr-2">
                  ({formatNumberToPersian(order.items?.length ?? 0)} قلم)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items?.length ? (
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const hasDiscount =
                      item.discounted_price > 0 &&
                      item.discounted_price < item.price;
                    const unitPrice = hasDiscount
                      ? item.discounted_price
                      : item.price;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-14 h-14 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-lg bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {item.product_name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <p className="text-xs text-gray-500">
                                {formatNumberToPersian(unitPrice)} تومان ×{" "}
                                {formatNumberToPersian(item.quantity)}
                              </p>
                              {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through">
                                  {formatNumberToPersian(item.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="font-bold text-sm whitespace-nowrap">
                          {formatNumberToPersian(item.total_price)} تومان
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  محصولی ثبت نشده است
                </p>
              )}
            </CardContent>
          </Card>

          {/* ---------- اطلاعات پرداخت ---------- */}
          {order.payment_authority && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  اطلاعات پرداخت
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.gateway?.name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">درگاه پرداخت</span>
                    <span className="font-medium">{order.gateway.name}</span>
                  </div>
                )}

                {order.payment_authority && (
                  <div className="flex items-center justify-between text-sm gap-4">
                    <span className="text-gray-500 shrink-0">
                      شناسه پرداخت
                    </span>
                    <span className="font-mono text-xs truncate" dir="ltr">
                      {order.payment_authority}
                    </span>
                  </div>
                )}

                {order.payment_ref_id && (
                  <div className="flex items-center justify-between text-sm gap-4">
                    <span className="text-gray-500 shrink-0">شماره پیگیری</span>
                    <span className="font-mono text-xs truncate" dir="ltr">
                      {order.payment_ref_id}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ==================== ستون کناری ==================== */}
        <div className="space-y-6">
          {/* ---------- تغییر وضعیت ---------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                تغییر وضعیت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {statusOptions.map((opt) => {
                  const isActive = opt.value === order.status;
                  const isPending = pendingStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleStatusChange(opt.value)}
                      disabled={isActive || Boolean(pendingStatus)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        isActive
                          ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold cursor-default"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      } disabled:opacity-50`}
                    >
                      <span>{opt.label}</span>
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isActive ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ---------- اطلاعات مشتری ---------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                اطلاعات مشتری
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.user ? (
                <>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">نام</p>
                    <p className="font-medium text-sm">
                      {order.user.full_name}
                    </p>
                  </div>
                  {order.user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                      <span dir="ltr">{order.user.phone}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  اطلاعات مشتری ثبت نشده
                </p>
              )}
            </CardContent>
          </Card>

          {/* ---------- آدرس ارسال ---------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                آدرس ارسال
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.address ? (
                <div className="space-y-3 text-sm">
                  {order.address.title && (
                    <Badge className="bg-gray-100 text-gray-700 gap-1">
                      <Building2 className="h-3 w-3" />
                      {order.address.title}
                    </Badge>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {order.address.full_address}
                  </p>
                  <div className="pt-2 border-t space-y-1">
                    <p className="text-xs text-gray-500">
                      {order.address.province}، {order.address.city}
                    </p>
                    {order.address.postal_code && (
                      <p className="text-xs text-gray-500">
                        کد پستی: {order.address.postal_code}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">آدرسی ثبت نشده است</p>
              )}
            </CardContent>
          </Card>

          {/* ---------- خلاصه مالی ---------- */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                خلاصه مالی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">جمع کل</span>
                <span className="font-medium">
                  {formatNumberToPersian(order.total_amount)} تومان
                </span>
              </div>

              {order.total_savings > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>صرفه‌جویی</span>
                  <span className="font-medium">
                     {formatNumberToPersian(order.total_savings)} تومان
                  </span>
                </div>
              )}

              {order.discount_amount > 0 && (
                <div className="flex items-center justify-between text-green-600">
                  <span>تخفیف</span>
                  <span className="font-medium">
                    - {formatNumberToPersian(order.discount_amount)} تومان
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="font-bold">مبلغ نهایی</span>
                <span className="font-bold text-base">
                  {formatNumberToPersian(order.final_amount)} تومان
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}