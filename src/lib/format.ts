// تبدیل ارقام انگلیسی به فارسی (بدون جداکننده)
export function toPersianDigits(input: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(input).replace(/\d/g, (digit) => persianDigits[Number(digit)]);
}

// فرمت عدد با جداکننده هزارگان و ارقام فارسی (برای مبالغ، تعداد و...)
export function formatNumberToPersian(value: number | string): string {
  const number = Number(value);
  if (isNaN(number)) return "۰";
  return new Intl.NumberFormat("fa-IR").format(number);
}

// فرمت مبلغ با تومان
export function formatCurrencyToPersian(value: number): string {
  return `${formatNumberToPersian(value)} تومان`;
}

// تبدیل تاریخ میلادی به شمسی
export function toPersianDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}