"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AppInputProps = React.ComponentProps<typeof Input> & {
  suffix?: React.ReactNode;
  numeric?: boolean;
  thousandsSeparator?: boolean;
  persianDigits?: boolean;
  dir?: "ltr" | "rtl";
};

function normalizeNumericString(value: string): string {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const englishDigits = "0123456789";
  let result = value;
  for (let i = 0; i < persianDigits.length; i++) {
    result = result.replace(new RegExp(persianDigits[i], "g"), englishDigits[i]);
  }
  result = result.replace(/,/g, "").replace(/\D/g, "");
  return result;
}

function formatNumericString(
  value: string,
  thousandsSeparator: boolean,
  persianDigits: boolean
): string {
  if (!value) return "";
  const num = Number(value);
  if (isNaN(num)) return value;
  if (thousandsSeparator) {
    const formatted = new Intl.NumberFormat("fa-IR").format(num);
    if (!persianDigits) {
      return formatted.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
    }
    return formatted;
  } else {
    const digits = value;
    if (persianDigits) {
      return digits.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
    }
    return digits;
  }
}

export function AppInput({
  suffix,
  className,
  numeric = false,
  thousandsSeparator = true,
  persianDigits = true,
  dir,
  onChange,
  value,
  ...props
}: AppInputProps) {
  const inputDir = dir !== undefined ? dir : numeric ? "ltr" : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!numeric) {
      onChange?.(e);
      return;
    }
    const normalized = normalizeNumericString(e.target.value);
    e.target.value = normalized;
    onChange?.(e);
  };

  const displayValue = numeric
    ? formatNumericString(String(value || ""), thousandsSeparator, persianDigits)
    : value;

  const inputElement = (
    <Input
      className={cn(
        "h-10", // ✅ ارتفاع یکسان با SelectInput
        "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-blue-500",
        suffix ? "pl-9" : "",
        className
      )}
      inputMode={numeric ? "numeric" : undefined}
      dir={inputDir}
      value={displayValue}
      onChange={handleChange}
      {...props}
    />
  );

  if (suffix) {
    return (
      <div className="relative">
        {inputElement}
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
          {suffix}
        </span>
      </div>
    );
  }

  return inputElement;
}