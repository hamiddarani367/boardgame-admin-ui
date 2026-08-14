"use client";

import React, { useEffect, useRef } from "react";
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
  Undo,
  Redo,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  onImageUpload?: (file: File) => Promise<string>;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "متن خود را بنویسید...",
  minHeight = "200px",
  onImageUpload,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    if (onImageUpload) {
      try {
        const url = await onImageUpload(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        console.error("خطا در آپلود تصویر:", error);
        alert("آپلود تصویر ناموفق بود");
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        editor.chain().focus().setImage({ src: dataUrl }).run();
      };
      reader.readAsDataURL(file);
    }

    event.target.value = "";
  };

  if (!editor) return null;

  const toolbarButtons = [
    { icon: Bold, label: "بولد", onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { icon: Italic, label: "ایتالیک", onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { icon: Heading1, label: "تیتر ۱", onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive("heading", { level: 1 }) },
    { icon: Heading2, label: "تیتر ۲", onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { icon: List, label: "لیست نقطه‌ای", onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { icon: ListOrdered, label: "لیست شماره‌ای", onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { icon: Undo, label: "لغو", onClick: () => editor.chain().focus().undo().run(), active: false },
    { icon: Redo, label: "بازگردانی", onClick: () => editor.chain().focus().redo().run(), active: false },
    { icon: ImageIcon, label: "افزودن تصویر", onClick: () => fileInputRef.current?.click(), active: false },
  ];

  return (
    <div dir="rtl" className="rounded-md border border-input bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
        {toolbarButtons.map((btn, idx) => (
          <button
            key={idx}
            type="button"
            onClick={btn.onClick}
            title={btn.label}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
              "hover:bg-muted",
              btn.active && "bg-blue-100 text-blue-700"
            )}
          >
            <btn.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3"
        style={{ minHeight }}
      />
      <style jsx>{`
        :global(.tiptap) {
          min-height: ${minHeight};
          outline: none;
          text-align: right;
        }
        :global(.tiptap img) {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  );
}