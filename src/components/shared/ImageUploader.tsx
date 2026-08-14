"use client";

import React, { useState, useRef, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  multiple?: boolean;
  maxFiles?: number;
  value?: string[]; // آرایه URL های فعلی
  onChange?: (urls: string[]) => void; // با هر تغییر (اضافه/حذف) صدا زده می‌شود
  onUpload?: (file: File) => Promise<string>; // تابع آپلود واقعی (اختیاری)
  className?: string;
  accept?: string;
}

export function ImageUploader({
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  value = [],
  onChange,
  onUpload,
  className,
  accept = "image/*",
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(value);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // به‌روزرسانی والد هنگام تغییر
  const updateImages = (newImages: string[]) => {
    setImages(newImages);
    onChange?.(newImages);
  };

  const addFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const availableSlots = maxFiles - images.length;
      if (availableSlots <= 0) return;
      const filesToAdd = Array.from(fileList).slice(0, availableSlots);

      if (!onUpload) {
        // حالت بدون API: ساخت URL موقت
        const tempUrls = filesToAdd.map((file) => URL.createObjectURL(file));
        updateImages([...images, ...tempUrls]);
        return;
      }

      // حالت واقعی: آپلود و دریافت URL
      setIsUploading(true);
      try {
        const uploadPromises = filesToAdd.map((file) => onUpload(file));
        const uploadedUrls = await Promise.all(uploadPromises);
        updateImages([...images, ...uploadedUrls]);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [images, maxFiles, onUpload, onChange]
  );

  const removeImage = (index: number) => {
    const newImages = [...images];
    const removed = newImages.splice(index, 1)[0];
    // اگر URL موقت بود، آزاد کن
    if (removed.startsWith("blob:")) {
      URL.revokeObjectURL(removed);
    }
    updateImages(newImages);
  };

  return (
    <div className={cn("flex items-center gap-3 rounded-md border border-input bg-background p-2 min-h-[50px] flex-wrap", className)}>
      {/* نمایش تصاویر دایره‌ای */}
      {images.map((img, index) => (
        <div key={img} className="relative h-10 w-10">
          <img
            src={img}
            alt={`تصویر ${index + 1}`}
            className="h-full w-full rounded-full object-cover border"
          />
          <button
            type="button"
            onClick={() => removeImage(index)}
            className="absolute -top-1 -left-1 rounded-full bg-red-500 text-white p-0.5 hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {/* دکمه افزودن */}
      {images.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      )}

      {images.length === 0 && !isUploading && (
        <span className="text-sm text-muted-foreground mr-2">
          برای آپلود کلیک کنید
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}