import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        {/* آیکون بزرگ */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <FileQuestion className="h-12 w-12" />
        </div>

        {/* شماره ۴۰۴ */}
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          ۴۰۴
        </h1>

        {/* توضیح */}
        <p className="text-lg text-muted-foreground">
          صفحه‌ای که به دنبال آن هستید یافت نشد!
        </p>
        <p className="text-sm text-muted-foreground">
          ممکن است آدرس را اشتباه وارد کرده باشید یا صفحه حذف شده باشد.
        </p>

        {/* دکمه بازگشت */}
        <Button className="mt-4" size="lg">
          <Link href="/dashboard">بازگشت به داشبورد</Link>
        </Button>
      </div>
    </div>
  );
}