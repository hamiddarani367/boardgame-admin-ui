"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BaseButtonProps = React.ComponentProps<typeof Button>;

// واریانت‌های سفارشی
export type CustomVariant = "soft-blue" | "soft-red" | "soft-green" | "blue" | "red" | "green";

export type AppButtonVariant = BaseButtonProps["variant"] | CustomVariant;

interface AppButtonProps extends Omit<BaseButtonProps, "variant"> {
  loading?: boolean;
  variant?: AppButtonVariant;
}

const customVariantStyles: Record<CustomVariant, string> = {
  "soft-blue":
    "bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 border border-blue-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  "soft-red":
    "bg-red-100 text-red-700 hover:bg-red-200 active:bg-red-300 border border-red-200 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
  "soft-green":
    "bg-green-100 text-green-700 hover:bg-green-200 active:bg-green-300 border border-green-200 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
  blue: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
  red: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2",
  green: "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
};

// Type guard برای واریانت‌های سفارشی
function isCustomVariant(variant: any): variant is CustomVariant {
  return customVariantStyles.hasOwnProperty(variant);
}

export function AppButton({
  loading = false,
  disabled,
  children,
  variant = "default",
  className,
  size = "default",
  ...props
}: AppButtonProps) {
  const custom = isCustomVariant(variant);
  // در صورت سفارشی بودن، از ghost به عنوان پایه استفاده می‌کنیم
  const baseVariant = custom ? "ghost" : (variant as BaseButtonProps["variant"]);
  const customClasses = custom ? customVariantStyles[variant] : "";

  return (
    <Button
      variant={baseVariant}
      size={size}
      disabled={disabled || loading}
      className={cn(customClasses, className)}
      {...props}
    >
      {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  );
}