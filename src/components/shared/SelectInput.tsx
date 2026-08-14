"use client";

import React from "react";
import Select, { StylesConfig } from "react-select";

export type Option = {
  value: string;
  label: string;
  [key: string]: any; // برای ذخیره سایر فیلدها (مثل id، title و ...)
};

interface SelectInputProps {
  options: any[]; // داده خام از backend
  value?: string | string[] | null; // مقدار ساده (نه آبجکت)
  onChange?: (value: string | string[] | null) => void;
  isMulti?: boolean;
  placeholder?: string;
  className?: string;
  isSearchable?: boolean;
  valueKey?: string; // پیش‌فرض "value"
  labelKey?: string; // پیش‌فرض "label"
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
}: SelectInputProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // نرمال‌سازی Options
  const normalizedOptions: Option[] = React.useMemo(() => {
    return options.map((opt) => ({
      value: String(opt[valueKey]),
      label: String(opt[labelKey]),
      ...opt,
    }));
  }, [options, valueKey, labelKey]);

  // تبدیل value ساده به آبجکت‌های Option برای react-select
  const selectedValue = React.useMemo(() => {
    if (isMulti) {
      if (!value) return [];
      const arr = Array.isArray(value) ? value : [value];
      return arr
        .map((v) => normalizedOptions.find((o) => o.value === v))
        .filter(Boolean);
    } else {
      if (!value || Array.isArray(value)) return null;
      return normalizedOptions.find((o) => o.value === value) || null;
    }
  }, [normalizedOptions, value, isMulti]);

  const handleChange = (newValue: any) => {
    if (isMulti) {
      const multiValue = newValue as Option[];
      onChange?.(multiValue.length ? multiValue.map((opt) => opt.value) : null);
    } else {
      const singleValue = newValue as Option | null;
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