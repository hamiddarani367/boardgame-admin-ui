"use client";

import React from "react";
import Select, { StylesConfig } from "react-select";

export type Option = {
  value: string;
  label: string;
  [key: string]: unknown;
};

// تایپ‌های خروجی ساده‌تر
export type SelectValue = string | string[] | null;

interface SelectInputProps {
  options: unknown[]; // داده‌های خام
  value?: SelectValue; // مقدار انتخابی (رشته یا آرایه رشته)
  onChange?: (value: SelectValue) => void; // ✅ فقط string|string[]|null
  isMulti?: boolean;
  placeholder?: string;
  className?: string;
  isSearchable?: boolean;
  valueKey?: string;
  labelKey?: string;
  disabled?: boolean;
}

export function SelectInput({
  options,
  value,
  onChange,
  isMulti = false,
  placeholder = "انتخاب کنید...",
  className,
  isSearchable = false,
  valueKey = "value",
  labelKey = "label",
  disabled = false,
}: SelectInputProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // نرمال‌سازی گزینه‌ها
  const normalizedOptions: Option[] = React.useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null) {
        const record = opt as Record<string, unknown>;
        return {
          value: String(record[valueKey]),
          label: String(record[labelKey]),
          ...record,
        };
      }
      return { value: String(opt), label: String(opt) };
    });
  }, [options, valueKey, labelKey]);

  // تبدیل value ساده به آبجکت‌های Option برای react-select
  const selectedValue = React.useMemo(() => {
    if (isMulti) {
      if (!value) return [];
      const arr = Array.isArray(value) ? value : [value];
      return arr
        .map((v) => normalizedOptions.find((o) => o.value === v))
        .filter(Boolean) as Option[];
    } else {
      if (!value || Array.isArray(value)) return null;
      return normalizedOptions.find((o) => o.value === value) || null;
    }
  }, [normalizedOptions, value, isMulti]);

  const handleChange = (newValue: unknown) => {
    if (isMulti) {
      const multiValue = newValue as Option[];
      // ✅ ارسال آرایه‌ای از value ها
      onChange?.(multiValue.length ? multiValue.map((opt) => opt.value) : null);
    } else {
      const singleValue = newValue as Option | null;
      // ✅ ارسال فقط value رشته‌ای
      onChange?.(singleValue ? singleValue.value : null);
    }
  };

  if (!mounted) {
    return <div className={`${className} h-10 bg-background border rounded-md`} />;
  }

  return (
    <Select
      options={normalizedOptions}
      value={selectedValue}
      onChange={handleChange}
      isMulti={isMulti}
      placeholder={placeholder}
      isClearable={false}
      isSearchable={isSearchable}
      isDisabled={disabled}
      className={className}
      classNamePrefix="react-select"
      menuPortalTarget={document.body}
      menuPosition="fixed"
      menuPlacement="auto"
      maxMenuHeight={250}
      noOptionsMessage={() => "موردی یافت نشد"}
    />
  );
}