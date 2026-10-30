"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery, useApiMutation } from "@/hooks/useApi";
import { SelectInput } from "@/components/shared/SelectInput";
import { BooleanSelect } from "@/components/shared/BooleanSelect";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { AxiosError } from "axios";

// بارگذاری داینامیک MapPicker برای جلوگیری از خطای SSR
const MapPicker = dynamic(
  () => import("@/components/shared/MapPicker").then((mod) => mod.MapPicker),
  {
    ssr: false,
    loading: () => (
      <div className="h-[250px] bg-gray-100 animate-pulse rounded-md" />
    ),
  }
);

// ==================== تایپ‌ها ====================
interface User {
  id: number;
  phone: string;
}

interface City {
  id: number;
  name: string;
}

interface Province {
  id: number;
  name: string;
}

export interface AddressPayload {
  user_id: number;
  title: string | null;
  full_address: string;
  city_id: number;
  province_id: number;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
}

export interface AddressInitialData {
  id?: number;
  user_id?: number;
  title?: string;
  full_address: string;
  city_id?: number;
  province_id?: number;
  postal_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
}

interface AddressFormProps {
  initialData?: AddressInitialData;
  isEdit?: boolean;
}

// ==================== schema ====================
const addressFormSchema = z.object({
  user_id: z.string().min(1, "کاربر را انتخاب کنید"),
  title: z.string().max(100, "عنوان حداکثر ۱۰۰ حرف").optional().or(z.literal("")),
  full_address: z.string().min(5, "آدرس کامل را وارد کنید"),
  city_id: z.string().min(1, "شهر را انتخاب کنید"),
  province_id: z.string().min(1, "استان را انتخاب کنید"),
  postal_code: z.string().max(20, "کد پستی حداکثر ۲۰ رقم").optional().or(z.literal("")),
  latitude: z.string().optional().or(z.literal("")),
  longitude: z.string().optional().or(z.literal("")),
  is_default: z.boolean(),
});

type AddressFormValues = z.infer<typeof addressFormSchema>;

export function AddressForm({ initialData, isEdit = false }: AddressFormProps) {
  const router = useRouter();

  // دریافت کاربران و استان‌ها
  const { data: usersData, isLoading: usersLoading } = useApiQuery<User[]>(
    "/admin/users/all",
    ["users-list"]
  );
  const { data: provincesData, isLoading: provincesLoading } = useApiQuery<Province[]>(
    "/admin/provinces/all",
    ["provinces-list"]
  );

  // mutation های ایجاد و ویرایش
  const createAddress = useApiMutation<unknown, AddressPayload>(
    "/admin/addresses",
    "POST",
    ["addresses"]
  );

  const updateAddress = useApiMutation<unknown, AddressPayload>(
    `/admin/addresses/${initialData?.id ?? ""}`,
    "PUT",
    ["addresses"]
  );

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: {
      user_id: initialData?.user_id ? String(initialData.user_id) : "",
      title: initialData?.title || "",
      full_address: initialData?.full_address || "",
      city_id: initialData?.city_id ? String(initialData.city_id) : "",
      province_id: initialData?.province_id ? String(initialData.province_id) : "",
      postal_code: initialData?.postal_code || "",
      latitude:
        initialData?.latitude !== undefined && initialData.latitude !== null
          ? String(initialData.latitude)
          : "",
      longitude:
        initialData?.longitude !== undefined && initialData.longitude !== null
          ? String(initialData.longitude)
          : "",
      is_default: initialData?.is_default ?? false,
    },
  });

  const provinceId = watch("province_id");

  // دریافت شهرها بر اساس استان انتخابی
  const { data: citiesData, isLoading: citiesLoading } = useApiQuery<City[]>(
    "/admin/cities/all",
    ["cities-list", provinceId],
    { province_id: provinceId || undefined },
    { enabled: !!provinceId }
  );

  const latitudeValue = watch("latitude");
  const longitudeValue = watch("longitude");

  const onSubmitForm = async (data: AddressFormValues) => {
    const payload: AddressPayload = {
      user_id: Number(data.user_id),
      title: data.title || null,
      full_address: data.full_address,
      city_id: Number(data.city_id),
      province_id: Number(data.province_id),
      postal_code: data.postal_code || null,
      latitude: data.latitude ? parseFloat(data.latitude) : null,
      longitude: data.longitude ? parseFloat(data.longitude) : null,
      is_default: data.is_default,
    };

    try {
      if (isEdit && initialData?.id) {
        await updateAddress.mutateAsync(payload);
        toast.success("آدرس با موفقیت ویرایش شد");
      } else {
        await createAddress.mutateAsync(payload);
        toast.success("آدرس با موفقیت ایجاد شد");
      }
      router.push("/users/addresses");
    } catch (error) {
      if (error instanceof AxiosError) {
        const responseData = error.response?.data as { error?: string } | undefined;
        toast.error(responseData?.error || "خطا در ذخیره آدرس");
      } else {
        toast.error("خطا در ذخیره آدرس");
      }
    }
  };

  return (
    <Card className="rounded-none shadow-sm">
      <CardHeader>
        <CardTitle>{isEdit ? "ویرایش آدرس" : "ایجاد آدرس"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* کاربر */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کاربر *</label>
              <Controller
                name="user_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={usersData || []}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب کاربر"
                    className="w-full"
                    valueKey="id"
                    labelKey="phone"
                    isSearchable
                  />
                )}
              />
              {usersLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>}
              {errors.user_id && <p className="text-xs text-red-500">{errors.user_id.message}</p>}
            </div>

            {/* عنوان */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">عنوان (مثلاً منزل، محل کار)</label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value || ""} onChange={field.onChange} placeholder="اختیاری" />
                )}
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>

            {/* استان */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">استان *</label>
              <Controller
                name="province_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={provincesData || []}
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("city_id", "");
                    }}
                    placeholder="انتخاب استان"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                  />
                )}
              />
              {provincesLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>}
              {errors.province_id && <p className="text-xs text-red-500">{errors.province_id.message}</p>}
            </div>

            {/* شهر */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">شهر *</label>
              <Controller
                name="city_id"
                control={control}
                render={({ field }) => (
                  <SelectInput
                    options={citiesData || []}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="انتخاب شهر"
                    className="w-full"
                    valueKey="id"
                    labelKey="name"
                    isSearchable
                    disabled={!provinceId}
                  />
                )}
              />
              {citiesLoading && <p className="text-xs text-muted-foreground">در حال بارگذاری شهرها...</p>}
              {!provinceId && <p className="text-xs text-muted-foreground">ابتدا استان را انتخاب کنید</p>}
              {errors.city_id && <p className="text-xs text-red-500">{errors.city_id.message}</p>}
            </div>

            {/* آدرس کامل */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">آدرس کامل *</label>
              <Controller
                name="full_address"
                control={control}
                render={({ field }) => (
                  <AppInput value={field.value} onChange={field.onChange} placeholder="آدرس کامل" />
                )}
              />
              {errors.full_address && (
                <p className="text-xs text-red-500">{errors.full_address.message}</p>
              )}
            </div>

            {/* کد پستی */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">کد پستی</label>
              <Controller
                name="postal_code"
                control={control}
                render={({ field }) => (
                  <AppInput
                    value={field.value || ""}
                    onChange={field.onChange}
                    placeholder="اختیاری"
                    dir="ltr"
                  />
                )}
              />
              {errors.postal_code && (
                <p className="text-xs text-red-500">{errors.postal_code.message}</p>
              )}
            </div>

            {/* پیش‌فرض */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">پیش‌فرض</label>
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <BooleanSelect
                    value={field.value}
                    onChange={field.onChange}
                    trueLabel="بله"
                    falseLabel="خیر"
                    placeholder="انتخاب کنید"
                    className="w-full"
                  />
                )}
              />
              {errors.is_default && (
                <p className="text-xs text-red-500">{errors.is_default.message}</p>
              )}
            </div>

            {/* نقشه */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-medium">انتخاب موقعیت جغرافیایی</label>
              <MapPicker
                value={
                  latitudeValue && longitudeValue
                    ? { lat: Number(latitudeValue), lng: Number(longitudeValue) }
                    : null
                }
                onChange={(pos) => {
                  setValue("latitude", String(pos.lat));
                  setValue("longitude", String(pos.lng));
                }}
                height="250px"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AppButton type="button" variant="red" onClick={() => router.back()}>
              انصراف
            </AppButton>
            <AppButton type="submit" variant="blue" loading={isSubmitting}>
              {isEdit ? "ذخیره تغییرات" : "ایجاد آدرس"}
            </AppButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}