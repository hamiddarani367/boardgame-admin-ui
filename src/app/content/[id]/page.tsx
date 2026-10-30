"use client";

import { useParams, useRouter } from "next/navigation";
import { useApiQuery, apiClient } from "@/hooks/useApi";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppButton } from "@/components/shared/AppButton";
import {
  ArrowRight,
  Pencil,
  Loader2,
  Eye,
  Heart,
  Clock,
  User,
  FolderTree,
  Tag,
  Calendar,
  CheckCircle,
  XCircle,
  ExternalLink,
  MessageCircle,
  Star,
  Globe,
  Hash,
} from "lucide-react";
import { toPersianDateTime } from "@/lib/date";
import { toast } from "sonner";
import { AxiosError } from "axios";

// ==================== تایپ‌ها ====================
interface ContentAuthorSummary {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  image?: string;
}

interface ContentCategorySummary {
  id: number;
  name: string;
  slug: string;
}

interface ContentTagSummary {
  id: number;
  name: string;
  slug: string;
}

interface ContentDetail {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  type: string;
  status: string;
  cover_image?: string;
  cover_alt?: string;
  author?: ContentAuthorSummary;
  category?: ContentCategorySummary;
  tags?: ContentTagSummary[];
  view_count: number;
  like_count: number;
  reading_time: number;
  is_featured: boolean;
  featured: boolean;
  enabled: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;

  content: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  canonical_url?: string;
  allow_comments: boolean;
  expires_at?: string;
}

// ==================== نقشه‌ها ====================
const TYPE_MAP: Record<string, string> = {
  article: "مقاله",
  news: "خبر",
  guide: "راهنما",
  review: "بررسی",
  tutorial: "آموزش",
  page: "صفحه",
};

const STATUS_MAP: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  draft: {
    label: "پیش‌نویس",
    className: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  published: {
    label: "منتشرشده",
    className: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  archived: {
    label: "بایگانی",
    className: "bg-gray-100 text-gray-700",
    icon: XCircle,
  },
  scheduled: {
    label: "زمان‌بندی‌شده",
    className: "bg-blue-100 text-blue-700",
    icon: Calendar,
  },
};

// ==================== کامپوننت ====================
export default function ContentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const contentId = Number(params.id);

  const { data, isLoading, isError } = useApiQuery<ContentDetail>(
    `/admin/contents/${contentId}`,
    ["content-detail", params.id]
  );

  // ==================== تغییر وضعیت انتشار ====================
  const handleTogglePublish = async () => {
    if (!data) return;
    try {
      await apiClient.patch(`/admin/contents/${data.id}/publish`);
      queryClient.invalidateQueries({
        queryKey: ["content-detail", params.id],
      });
      queryClient.invalidateQueries({ queryKey: ["contents"] });
      toast.success(
        data.status === "published"
          ? "محتوا از حالت انتشار خارج شد"
          : "محتوا منتشر شد"
      );
    } catch (error) {
      if (error instanceof AxiosError) {
        const res = error.response?.data as { error?: string } | undefined;
        toast.error(res?.error ?? "خطا در تغییر وضعیت انتشار");
      } else {
        toast.error("خطا در تغییر وضعیت انتشار");
      }
    }
  };

  // ==================== Loading ====================
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // ==================== Error ====================
  if (isError || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">محتوا یافت نشد</p>
        <AppButton variant="ghost" onClick={() => router.push("/content")}>
          <ArrowRight className="ml-2 h-4 w-4" />
          بازگشت به لیست
        </AppButton>
      </div>
    );
  }

  const content = data;
  const statusInfo = STATUS_MAP[content.status] ?? {
    label: content.status,
    className: "bg-gray-100 text-gray-700",
    icon: Clock,
  };
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* ==================== هدر ==================== */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AppButton
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/content")}
            title="بازگشت"
          >
            <ArrowRight className="h-5 w-5" />
          </AppButton>
          <div>
            <h1 className="text-2xl font-bold">{content.title}</h1>
            <p className="text-sm text-gray-500 mt-1" dir="ltr">
              /{content.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AppButton
            variant="outline"
            onClick={handleTogglePublish}
            title={content.status === "published" ? "لغو انتشار" : "انتشار"}
          >
            {content.status === "published" ? (
              <>
                <XCircle className="ml-2 h-4 w-4" />
                لغو انتشار
              </>
            ) : (
              <>
                <CheckCircle className="ml-2 h-4 w-4" />
                انتشار
              </>
            )}
          </AppButton>
          <AppButton
            variant="blue"
            onClick={() => router.push(`/content/${content.id}/edit`)}
          >
            <Pencil className="ml-2 h-4 w-4" />
            ویرایش
          </AppButton>
        </div>
      </div>

      {/* ==================== اطلاعات خلاصه ==================== */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge className={statusInfo.className}>
          <StatusIcon className="h-3.5 w-3.5 ml-1" />
          {statusInfo.label}
        </Badge>

        <Badge className="bg-blue-100 text-blue-700">
          {TYPE_MAP[content.type] ?? content.type}
        </Badge>

        {content.featured && (
          <Badge className="bg-purple-100 text-purple-700">
            <Star className="h-3.5 w-3.5 ml-1" />
            ویژه
          </Badge>
        )}

        {!content.enabled && (
          <Badge className="bg-red-100 text-red-700">غیرفعال</Badge>
        )}

        <span className="flex items-center gap-1 text-gray-500">
          <Eye className="h-4 w-4" />
          {content.view_count.toLocaleString("fa-IR")} بازدید
        </span>

        <span className="flex items-center gap-1 text-gray-500">
          <Heart className="h-4 w-4" />
          {content.like_count.toLocaleString("fa-IR")} لایک
        </span>

        <span className="flex items-center gap-1 text-gray-500">
          <Clock className="h-4 w-4" />
          {content.reading_time} دقیقه مطالعه
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ==================== ستون اصلی - پیش‌نمایش ==================== */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                پیش‌نمایش محتوا (نمایش کاربر)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* ✅ این بخش دقیقاً چیزی است که کاربر نهایی می‌بیند */}
              <div className="border rounded-lg p-6 bg-white dark:bg-gray-950">
                {/* تصویر شاخص */}
                {content.cover_image && (
                  <img
                    src={content.cover_image}
                    alt={content.cover_alt ?? content.title}
                    className="w-full h-64 object-cover rounded-lg mb-6"
                  />
                )}

                {/* عنوان */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {content.title}
                </h1>

                {/* متادیتا */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b">
                  {content.author && (
                    <div className="flex items-center gap-2">
                      {content.author.image ? (
                        <img
                          src={content.author.image}
                          alt={content.author.full_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )}
                      <span>{content.author.full_name}</span>
                    </div>
                  )}

                  {content.published_at && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{toPersianDateTime(content.published_at)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{content.reading_time} دقیقه</span>
                  </div>
                </div>

                {/* خلاصه */}
                {content.excerpt && (
                  <div className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border-r-4 border-blue-500">
                    {content.excerpt}
                  </div>
                )}

                {/* ✅ محتوای HTML (همون چیزی که کاربر می‌بینه) */}
                <div
                  className="prose prose-lg max-w-none dark:prose-invert
                    prose-headings:font-bold
                    prose-h1:text-3xl prose-h1:mb-4
                    prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3
                    prose-h3:text-xl prose-h3:mt-5 prose-h3:mb-2
                    prose-p:leading-relaxed prose-p:mb-4
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-lg prose-img:my-6
                    prose-ul:my-4 prose-ol:my-4
                    prose-li:my-1
                    prose-blockquote:border-r-4 prose-blockquote:border-blue-500 prose-blockquote:pr-4 prose-blockquote:italic
                    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
                    prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg
                  "
                  dangerouslySetInnerHTML={{ __html: content.content }}
                />

                {/* تگ‌ها */}
                {content.tags && content.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t">
                    <Tag className="h-4 w-4 text-gray-400" />
                    {content.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        className="bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ==================== اطلاعات SEO ==================== */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>اطلاعات SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {content.meta_title && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Meta Title</p>
                  <p className="text-sm">{content.meta_title}</p>
                </div>
              )}
              {content.meta_description && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Meta Description
                  </p>
                  <p className="text-sm leading-relaxed">
                    {content.meta_description}
                  </p>
                </div>
              )}
              {content.meta_keywords && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Meta Keywords</p>
                  <p className="text-sm">{content.meta_keywords}</p>
                </div>
              )}
              {content.canonical_url && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Canonical URL</p>
                  <a
                    href={content.canonical_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    dir="ltr"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {content.canonical_url}
                  </a>
                </div>
              )}
              {!content.meta_title &&
                !content.meta_description &&
                !content.meta_keywords &&
                !content.canonical_url && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    اطلاعات SEO ثبت نشده است
                  </p>
                )}
            </CardContent>
          </Card>
        </div>

        {/* ==================== ستون کناری ==================== */}
        <div className="space-y-6">
          {/* اطلاعات پایه */}
          <Card className="rounded-none shadow-sm">
            <CardHeader>
              <CardTitle>اطلاعات پایه</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Hash className="h-3.5 w-3.5" />
                  شناسه
                </span>
                <span className="font-mono">
                  {content.id.toLocaleString("fa-IR")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">وضعیت</span>
                <Badge className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">نوع</span>
                <span>{TYPE_MAP[content.type] ?? content.type}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  نظرات
                </span>
                <span>
                  {content.allow_comments ? "فعال" : "غیرفعال"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t">
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  ایجاد
                </span>
                <span className="text-xs">
                  {toPersianDateTime(content.created_at)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  ویرایش
                </span>
                <span className="text-xs">
                  {toPersianDateTime(content.updated_at)}
                </span>
              </div>

              {content.published_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    انتشار
                  </span>
                  <span className="text-xs">
                    {toPersianDateTime(content.published_at)}
                  </span>
                </div>
              )}

              {content.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">انقضا</span>
                  <span className="text-xs">
                    {toPersianDateTime(content.expires_at)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* نویسنده */}
          {content.author && (
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  نویسنده
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {content.author.image ? (
                    <img
                      src={content.author.image}
                      alt={content.author.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{content.author.full_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* دسته‌بندی */}
          {content.category && (
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  دسته‌بندی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className="bg-blue-100 text-blue-700">
                  {content.category.name}
                </Badge>
                <p
                  className="text-xs text-gray-400 mt-2 font-mono"
                  dir="ltr"
                >
                  {content.category.slug}
                </p>
              </CardContent>
            </Card>
          )}

          {/* تگ‌ها */}
          {content.tags && content.tags.length > 0 && (
            <Card className="rounded-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  تگ‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {content.tags.map((tag) => (
                    <Badge
                      key={tag.id}
                      className="bg-gray-100 text-gray-700"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}