"use client";

import { useState } from "react";
import { AppInput } from "./AppInput";
import { SelectInput } from "./SelectInput";
import { AppButton } from "./AppButton";
import { PersianDateTimeRangePicker } from "./PersianDateTimeRangePicker";
import { Search, X } from "lucide-react";

// تعریف نوع فیلد
export type FilterField = {
  name: string;
  label: string;
  type: "text" | "select" | "multi-select" | "date" | "date-range" | "date-time-range";
  options?: any[]; // داده‌های خام از backend
  placeholder?: string;
  valueKey?: string;   // کلید مقدار (پیش‌فرض "value")
  labelKey?: string;   // کلید برچسب (پیش‌فرض "label")
  colSpan?: 1 | 2;     // عرض دو ستونه برای فیلدهای خاص
};

interface FilterBarProps {
  fields: FilterField[];
  onFilter: (filters: Record<string, any>) => void;
  initialValues?: Record<string, any>;
}

export function FilterBar({ fields, onFilter, initialValues = {} }: FilterBarProps) {
  const [filters, setFilters] = useState<Record<string, any>>(initialValues);

  const updateFilter = (name: string, value: any) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // حذف مقادیر خالی
    const activeFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, v]) => v !== "" && v !== undefined && v !== null && (!Array.isArray(v) || v.length > 0)
      )
    );
    onFilter(activeFilters);
  };

  const handleReset = () => {
    setFilters({});
    onFilter({});
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-none p-4 mb-4 bg-card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {fields.map((field) => {
          const isMulti = field.type === "multi-select";
          // مقدار پیش‌فرض: آرایه خالی برای multi، رشته خالی برای single
          const defaultValue = isMulti ? [] : "";

          return (
            <div
              key={field.name}
              className={`flex flex-col gap-1 w-full ${
                field.colSpan === 2 ? "lg:col-span-2" : ""
              }`}
            >
              <label className="text-sm font-medium">{field.label}</label>

              {field.type === "text" && (
                <AppInput
                  placeholder={field.placeholder || `جستجوی ${field.label}`}
                  value={filters[field.name] || ""}
                  onChange={(e) => updateFilter(field.name, e.target.value)}
                />
              )}

              {(field.type === "select" || field.type === "multi-select") && (
                <SelectInput
                  options={field.options || []}
                  value={filters[field.name] !== undefined ? filters[field.name] : defaultValue}
                  onChange={(val) => updateFilter(field.name, val)}
                  isMulti={isMulti}
                  placeholder={field.placeholder || `انتخاب ${field.label}`}
                  className="w-full"
                  valueKey={field.valueKey || "value"}
                  labelKey={field.labelKey || "label"}
                />
              )}

              {field.type === "date" && (
                <AppInput
                  type="date"
                  value={filters[field.name] || ""}
                  onChange={(e) => updateFilter(field.name, e.target.value)}
                />
              )}

              {field.type === "date-range" && (
                <PersianDateTimeRangePicker
                  value={filters[field.name] || { from: null, to: null }}
                  onChange={(val) => updateFilter(field.name, val)}
                  fromPlaceholder="از تاریخ"
                  toPlaceholder="تا تاریخ"
                />
              )}

              {field.type === "date-time-range" && (
                <PersianDateTimeRangePicker
                  value={filters[field.name] || { from: null, to: null }}
                  onChange={(val) => updateFilter(field.name, val)}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-2">
        <AppButton type="submit" variant="blue" size="sm">
          <Search className="h-4 w-4" />
          اعمال فیلتر
        </AppButton>
        <AppButton type="button" variant="red" size="sm" onClick={handleReset}>
          <X className="h-4 w-4" />
          حذف فیلترها
        </AppButton>
      </div>
    </form>
  );
}