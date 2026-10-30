"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiClient } from "@/hooks/useApi";

/* ---------------------------------------------------------------
 * دامنه‌ی بک‌اند برای absolute کردن URLهای نسبی
 * --------------------------------------------------------------- */
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  "http://localhost:9000";

/**
 * تبدیل URL نسبی به مطلق
 *   /boardgame-images/contents/x.jpg → http://localhost:9000/boardgame-images/contents/x.jpg
 *   http://... یا data: → دست‌نخورده
 */
export function toAbsoluteUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:)?\/\//i.test(url)) return url;
  if (/^data:/i.test(url)) return url;
  return url.startsWith("/")
    ? `${BACKEND_URL}${url}`
    : `${BACKEND_URL}/${url}`;
}

/* ---------------------------------------------------------------
 * استخراج URL از پاسخ آپلود — همان منطق ImageUploader
 * --------------------------------------------------------------- */
function extractUrl(response: unknown): string {
  if (typeof response === "object" && response !== null) {
    const obj = response as Record<string, unknown>;
    if (typeof obj.url === "string") return obj.url;
    if (typeof obj.path === "string") return obj.path;
    if (typeof obj.data === "object" && obj.data !== null) {
      const data = obj.data as Record<string, unknown>;
      if (typeof data.url === "string") return data.url;
      if (typeof data.path === "string") return data.path;
    }
  }
  console.error("[RichTextEditor] ساختار پاسخ آپلود نامعتبر:", response);
  throw new Error("ساختار پاسخ آپلود نامعتبر است");
}

/* ---------------------------------------------------------------
 * آپلود پیش‌فرض — دقیقاً همون endpoint ای که ImageUploader استفاده می‌کنه
 * --------------------------------------------------------------- */
async function defaultUploadImage(
  file: File,
  folder: string
): Promise<string> {
  // اعتبارسنجی
  if (!file.type.startsWith("image/")) {
    throw new Error("فقط فایل تصویری مجاز است");
  }
  const MAX_MB = 5;
  if (file.size > MAX_MB * 1024 * 1024) {
    throw new Error(`حجم تصویر نباید بیشتر از ${MAX_MB} مگابایت باشد`);
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await apiClient.post("/admin/uploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return extractUrl(response.data);
}

/* ---------------------------------------------------------------
 * Props
 * --------------------------------------------------------------- */
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  /** پوشه‌ی ذخیره‌سازی در بک‌اند — مثلاً "contents" */
  folder?: string;
  /** اختیاری — اگر ندادی، از defaultUploadImage استفاده می‌شود */
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "متن خود را بنویسید...",
  minHeight = "300px",
  folder = "contents",
  onImageUpload,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { class: "rounded-xl" },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        dir: "rtl",
        class: "tiptap-content focus:outline-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const uploadFile = useCallback(
    async (file: File): Promise<string> => {
      if (onImageUpload) return onImageUpload(file);
      return defaultUploadImage(file, folder);
    },
    [onImageUpload, folder]
  );

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !editor) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const rawUrl = await uploadFile(file);
      const absoluteUrl = toAbsoluteUrl(rawUrl);
      editor.chain().focus().setImage({ src: absoluteUrl }).run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "آپلود ناموفق";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  if (!editor) {
    return (
      <div
        className="rounded-md border border-input bg-background flex items-center justify-center text-gray-400"
        style={{ minHeight }}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const toolbarButtons = [
    {
      icon: Bold,
      label: "بولد",
      onClick: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive("bold"),
    },
    {
      icon: Italic,
      label: "ایتالیک",
      onClick: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive("italic"),
    },
    {
      icon: Heading1,
      label: "تیتر ۱",
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      active: editor.isActive("heading", { level: 1 }),
    },
    {
      icon: Heading2,
      label: "تیتر ۲",
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      active: editor.isActive("heading", { level: 2 }),
    },
    {
      icon: Heading3,
      label: "تیتر ۳",
      onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      active: editor.isActive("heading", { level: 3 }),
    },
    {
      icon: List,
      label: "لیست نقطه‌ای",
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      active: editor.isActive("bulletList"),
    },
    {
      icon: ListOrdered,
      label: "لیست شماره‌ای",
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      active: editor.isActive("orderedList"),
    },
    {
      icon: Quote,
      label: "نقل قول",
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      active: editor.isActive("blockquote"),
    },
    {
      icon: Undo,
      label: "لغو",
      onClick: () => editor.chain().focus().undo().run(),
      active: false,
    },
    {
      icon: Redo,
      label: "بازگردانی",
      onClick: () => editor.chain().focus().redo().run(),
      active: false,
    },
  ];

  return (
    <div
      dir="rtl"
      className="rounded-md border border-input bg-background overflow-hidden"
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-2 bg-gray-50 dark:bg-gray-900">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={btn.onClick}
            title={btn.label}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
              "hover:bg-gray-200 dark:hover:bg-gray-700",
              btn.active &&
                "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            )}
          >
            <btn.icon className="h-4 w-4" />
          </button>
        ))}

        {/* دکمه آپلود تصویر */}
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
        <button
          type="button"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          title="افزودن تصویر"
          disabled={isUploading}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
            "hover:bg-gray-200 dark:hover:bg-gray-700",
            isUploading && "opacity-50 cursor-wait"
          )}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* خطای آپلود */}
      {uploadError && (
        <div className="px-3 py-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900 flex items-center justify-between">
          <span>{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-red-700 hover:text-red-900 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleImageUpload}
      />

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none"
        style={{ minHeight }}
      />

      <style jsx>{`
        :global(.tiptap) {
          min-height: ${minHeight};
          padding: 1rem;
          outline: none;
          text-align: right;
        }
        :global(.tiptap p) {
          margin: 0.5rem 0;
          line-height: 1.9;
        }
        :global(.tiptap h1) {
          font-size: 1.5rem;
          font-weight: 800;
          margin: 1rem 0 0.5rem;
        }
        :global(.tiptap h2) {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 1rem 0 0.5rem;
        }
        :global(.tiptap h3) {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0.75rem 0 0.5rem;
        }
        :global(.tiptap blockquote) {
          border-right: 3px solid #3b82f6;
          padding-right: 0.75rem;
          margin: 0.75rem 0;
          color: #4b5563;
        }
        :global(.tiptap ul) {
          list-style: disc;
          padding-right: 1.5rem;
          margin: 0.5rem 0;
        }
        :global(.tiptap ol) {
          list-style: decimal;
          padding-right: 1.5rem;
          margin: 0.5rem 0;
        }
        :global(.tiptap img) {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 0.75rem 0;
          display: block;
        }
        :global(.tiptap img.ProseMirror-selectednode) {
          outline: 3px solid #3b82f6;
        }
        :global(.tiptap p.is-editor-empty:first-child::before) {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: right;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}