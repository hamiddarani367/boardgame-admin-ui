/**
 * تبدیل تاریخ ISO به فرمت فارسی مثل: ۵ مهر ۱۴۰۵
 */
export function toPersianDate(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return "-";
  }
}

/**
 * تبدیل تاریخ ISO به فرمت تاریخ + ساعت فارسی
 * مثل: ۵ مهر ۱۴۰۵ - ۱۴:۴۵
 */
export function toPersianDateTime(dateStr?: string | null): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    const datePart = new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
    const timePart = new Intl.DateTimeFormat("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
    return `${datePart} - ${timePart}`;
  } catch {
    return "-";
  }
}