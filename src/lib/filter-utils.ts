import { SelectInput } from "@/components/shared/SelectInput";

// تعیین نام پارامتر در URL بر اساس نوع فیلد
// برای تک‌انتخابی: singular (مثلاً category_id)
// برای چندتایی: plural با پسوند "s" (مثلاً category_ids)
function getParamName(fieldName: string, isMulti: boolean): string {
  return isMulti ? `${fieldName}s` : fieldName; // ساده‌سازی
}

// سریالایز مقادیر فیلتر به query parameters
export function serializeFilters(
  filters: Record<string, any>,
  fieldConfigs: Record<string, { type: string; isMulti?: boolean }>
): URLSearchParams {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    const config = fieldConfigs[key];
    if (!config) {
      // رفتار پیش‌فرض
      if (value === null || value === undefined || value === "") return;
      if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else if (typeof value === "object") {
        params.set(key, String(value.value ?? value.id ?? ""));
      } else {
        params.set(key, String(value));
      }
      return;
    }

    // برای فیلدهای select / multi-select
    if (config.type === "select" || config.type === "multi-select") {
      const isMulti = config.isMulti || config.type === "multi-select";
      const paramName = getParamName(key, isMulti);
      if (value === null || value === undefined || value === "") return;

      if (isMulti) {
        const arr = Array.isArray(value) ? value : [value];
        if (arr.length === 0) return;
        params.set(paramName, arr.join(","));
      } else {
        params.set(paramName, String(value));
      }
    } else {
      // سایر فیلدها
      if (value === null || value === undefined || value === "") return;
      params.set(key, String(value));
    }
  });

  return params;
}

// خواندن فیلترها از URL
export function deserializeFilters(
  searchParams: URLSearchParams,
  fieldConfigs: Record<string, { type: string; isMulti?: boolean }>
): Record<string, any> {
  const filters: Record<string, any> = {};

  searchParams.forEach((value, key) => {
    const config = fieldConfigs[key];
    if (!config) {
      filters[key] = value; // مقدار ساده
      return;
    }

    if (config.type === "select" || config.type === "multi-select") {
      const isMulti = config.isMulti || config.type === "multi-select";
      if (isMulti) {
        filters[key] = value.split(",");
      } else {
        filters[key] = value;
      }
    } else {
      filters[key] = value;
    }
  });

  return filters;
}