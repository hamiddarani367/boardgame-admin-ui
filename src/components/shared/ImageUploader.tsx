"use client";

import React, { useState, useRef, useCallback } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/hooks/useApi";

interface ImageUploaderProps {
  multiple?: boolean;
  maxFiles?: number;
  value?: string[];
  onChange?: (urls: string[]) => void;
  onUpload?: (file: File, folder: string) => Promise<string>;
  onUploadMultiple?: (files: File[], folder: string) => Promise<string[]>;
  onDelete?: (url: string) => Promise<void>;
  folder?: string;
  objectKeyExtractor?: (url: string) => string;
  className?: string;
  accept?: string;
}

// استخراج url از پاسخ تک‌آپلود
function extractUrl(response: unknown): string {
  if (typeof response === "object" && response !== null) {
    const obj = response as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.data === "object" && obj.data !== null) {
      const data = obj.data as Record<string, unknown>;
      if (typeof data.url === "string") return data.url;
    }
  }
  throw new Error("ساختار پاسخ آپلود نامعتبر است");
}

// استخراج urlها از پاسخ چندآپلود (پشتیبانی از آرایه مستقیم)
function extractUrls(response: unknown): string[] {
  // اگر response مستقیماً آرایه‌ای از آبجکت‌ها باشد
  if (Array.isArray(response)) {
    return response
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          const obj = item as Record<string, unknown>;
          return typeof obj.url === "string" ? obj.url : "";
        }
        return "";
      })
      .filter(Boolean);
  }

  // اگر response آبجکتی با خاصیت urls باشد
  if (typeof response === "object" && response !== null) {
    const obj = response as Record<string, unknown>;

    // حالت urls مستقیم
    if (Array.isArray(obj.urls)) {
      return obj.urls as string[];
    }

    // حالت data که خود آرایه‌ای از آبجکت‌هاست
    if (Array.isArray(obj.data)) {
      return obj.data
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            const dataItem = item as Record<string, unknown>;
            return typeof dataItem.url === "string" ? dataItem.url : "";
          }
          return "";
        })
        .filter(Boolean);
    }

    // حالت data که آبجکتی با خاصیت urls است
    if (typeof obj.data === "object" && obj.data !== null) {
      const data = obj.data as Record<string, unknown>;
      if (Array.isArray(data.urls)) {
        return data.urls as string[];
      }
    }
  }

  throw new Error("ساختار پاسخ آپلود چندگانه نامعتبر است");
}

// استخراج object_key از URL برای حذف
function defaultObjectKeyExtractor(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname; // /bucket/folder/file.jpg
    const segments = path.split("/").filter(Boolean);
    if (segments.length >= 2) {
      return segments.slice(1).join("/");
    }
    return segments[0] || "";
  } catch {
    return url;
  }
}

export function ImageUploader({
  multiple = false,
  maxFiles = multiple ? 10 : 1,
  value = [],
  onChange,
  onUpload,
  onUploadMultiple,
  onDelete,
  folder = "general",
  objectKeyExtractor = defaultObjectKeyExtractor,
  className,
  accept = "image/*",
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultUploadSingle = useCallback(
    async (file: File, folder: string): Promise<string> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const response = await apiClient.post("/admin/uploads", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return extractUrl(response.data);
    },
    []
  );

  const defaultUploadMultiple = useCallback(
    async (files: File[], folder: string): Promise<string[]> => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("folder", folder);
      const response = await apiClient.post("/admin/uploads/multiple", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return extractUrls(response.data);
    },
    []
  );

  const defaultDelete = useCallback(
    async (url: string): Promise<void> => {
      const objectKey = objectKeyExtractor(url);
      await apiClient.delete("/admin/uploads", {
        data: { object_key: objectKey },
      });
    },
    [objectKeyExtractor]
  );

  const handleAddFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const availableSlots = maxFiles - value.length;
      if (availableSlots <= 0) return;
      const filesToAdd = Array.from(fileList).slice(0, availableSlots);

      setIsUploading(true);
      try {
        let newUrls: string[] = [];

        if (multiple) {
          if (onUploadMultiple) {
            newUrls = await onUploadMultiple(filesToAdd, folder);
          } else if (onUpload) {
            newUrls = await Promise.all(filesToAdd.map((file) => onUpload(file, folder)));
          } else {
            newUrls = await defaultUploadMultiple(filesToAdd, folder);
          }
        } else {
          const file = filesToAdd[0];
          if (file) {
            if (onUpload) {
              newUrls = [await onUpload(file, folder)];
            } else {
              newUrls = [await defaultUploadSingle(file, folder)];
            }
          }
        }

        const combined = [...value, ...newUrls];
        onChange?.(combined);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [value, maxFiles, multiple, folder, onUpload, onUploadMultiple, defaultUploadSingle, defaultUploadMultiple, onChange]
  );

  const handleRemove = useCallback(
    async (index: number) => {
      const removedUrl = value[index];
      const newUrls = value.filter((_, i) => i !== index);

      if (removedUrl && !removedUrl.startsWith("blob:")) {
        try {
          if (onDelete) {
            await onDelete(removedUrl);
          } else {
            await defaultDelete(removedUrl);
          }
        } catch (error) {
          console.error("Delete error:", error);
        }
      } else if (removedUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(removedUrl);
      }

      onChange?.(newUrls);
    },
    [value, onDelete, defaultDelete, onChange]
  );

  return (
    <div className={cn("flex items-center gap-3 rounded-md border border-input bg-background p-2 min-h-[50px] flex-wrap", className)}>
      {value.map((img, index) => (
        <div key={img} className="relative h-10 w-10">
          <img src={img} alt={`تصویر ${index + 1}`} className="h-full w-full rounded-full object-cover border" />
          <button
            type="button"
            onClick={() => handleRemove(index)}
            className="absolute -top-1 -left-1 rounded-full bg-red-500 text-white p-0.5 hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}

      {value.length < maxFiles && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/50 text-muted-foreground hover:border-blue-500 hover:text-blue-500 transition-colors"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </button>
      )}

      {value.length === 0 && !isUploading && (
        <span className="text-sm text-muted-foreground mr-2">برای آپلود کلیک کنید</span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleAddFiles(e.target.files)}
      />
    </div>
  );
}