"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { AppInput } from "@/components/shared/AppInput";
import { AppButton } from "@/components/shared/AppButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiMutation } from "@/hooks/useApi";
import { useContext } from "react";
import { AuthContext } from "@/providers/AuthProvider";
import { toast } from "sonner";
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";
import { AxiosError } from "axios";

// تایپ‌های دقیق بر اساس پاسخ سرور
interface User {
  id: number;
  firstname: string;
  lastname: string;
  phone: string;
  permissions: string[];
}

interface Tokens {
  access_token: string;
  refresh_token: string;
}

interface VerifyOtpResponse {
  tokens: Tokens;
  user: User;
}

interface RequestOtpResponse {
  success: boolean;
  message?: string;
}

// تایپ کاربر برای AuthContext (شامل permissions)
interface AuthUser {
  id: string;
  name: string;
  phone: string;
  permissions?: string[]; // ✅ اضافه شد
}

// schema مرحله اول
const loginStep1Schema = z.object({
  phone: z.string().min(11, "شماره موبایل ۱۱ رقم باشد").max(11, "شماره موبایل ۱۱ رقم باشد"),
});

// schema مرحله دوم
const loginStep2Schema = z.object({
  otp: z.string().min(4, "کد تأیید معتبر نیست").max(6, "کد تأیید معتبر نیست"),
});

type Step1Values = z.infer<typeof loginStep1Schema>;
type Step2Values = z.infer<typeof loginStep2Schema>;

// تبدیل پاسخ سرور به فرمت مورد انتظار AuthContext
function mapUserToAuthUser(user: User): AuthUser {
  const fullName = `${user.firstname} ${user.lastname}`.trim();
  return {
    id: String(user.id),
    name: fullName || "کاربر",
    phone: user.phone,
    permissions: user.permissions || [], // ✅ اضافه شد
  };
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState<string>("");

  const requestOtpMutation = useApiMutation<RequestOtpResponse, { phone: string }>(
    "/auth/send-otp",
    "POST"
  );

  const verifyOtpMutation = useApiMutation<VerifyOtpResponse, { phone: string; otp: string }>(
    "/auth/verify-otp",
    "POST"
  );

  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(loginStep1Schema),
    defaultValues: { phone: "" },
  });

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(loginStep2Schema),
    defaultValues: { otp: "" },
  });

  const handleAxiosError = (error: unknown, fallback: string): string => {
    if (error instanceof AxiosError) {
      const data = error.response?.data as { error?: string; message?: string } | undefined;
      return data?.error || data?.message || fallback;
    }
    return fallback;
  };

  const onSubmitStep1 = async (data: Step1Values) => {
    try {
      await requestOtpMutation.mutateAsync({ phone: data.phone });
      setPhone(data.phone);
      setStep(2);
      toast.success("کد تأیید ارسال شد");
    } catch (error) {
      toast.error(handleAxiosError(error, "شماره موبایل نامعتبر است"));
    }
  };

  const onSubmitStep2 = async (data: Step2Values) => {
    try {
      const response = await verifyOtpMutation.mutateAsync({
        phone: phone,
        otp: data.otp,
      });

      const tokens = response.tokens;
      const user = response.user;

      if (!tokens?.access_token || !tokens?.refresh_token || !user) {
        toast.error("پاسخ سرور نامعتبر است");
        return;
      }

      // تبدیل user به فرمت AuthContext با permissions
      const authUser = mapUserToAuthUser(user);

      // ذخیره‌سازی در AuthContext
      auth?.login(tokens.access_token, tokens.refresh_token, authUser);

      toast.success("ورود موفقیت‌آمیز بود");
      router.push("/dashboard");
    } catch (error) {
      toast.error(handleAxiosError(error, "کد تأیید نامعتبر است"));
    }
  };

  const goBack = () => {
    setStep(1);
    setPhone("");
    step2Form.reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md rounded-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-800">
            {step === 1 ? "ورود به پنل مدیریت" : "تأیید کد"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Board Kingdom</p>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">شماره موبایل *</label>
                <Controller
                  name="phone"
                  control={step1Form.control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                      className="h-12 text-left"
                    />
                  )}
                />
                {step1Form.formState.errors.phone && (
                  <p className="text-xs text-red-500">
                    {step1Form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              <AppButton
                type="submit"
                variant="blue"
                className="w-full h-12 text-base"
                loading={requestOtpMutation.isPending}
              >
                <ArrowRight className="ml-2 h-5 w-5" />
                دریافت کد تأیید
              </AppButton>
            </form>
          ) : (
            <form onSubmit={step2Form.handleSubmit(onSubmitStep2)} className="space-y-6">
              <div className="text-center text-sm text-muted-foreground">
                کد تأیید به شماره <span dir="ltr">{phone}</span> ارسال شد.
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">کد تأیید *</label>
                <Controller
                  name="otp"
                  control={step2Form.control}
                  render={({ field }) => (
                    <AppInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="مثلاً ۱۲۳۴۵۶"
                      dir="ltr"
                      className="h-12 text-center tracking-widest"
                      maxLength={6}
                    />
                  )}
                />
                {step2Form.formState.errors.otp && (
                  <p className="text-xs text-red-500">
                    {step2Form.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <AppButton
                  type="button"
                  variant="ghost"
                  className="h-12 flex-1"
                  onClick={goBack}
                >
                  <ArrowLeft className="ml-2 h-5 w-5" />
                  بازگشت
                </AppButton>
                <AppButton
                  type="submit"
                  variant="blue"
                  className="h-12 flex-1"
                  loading={verifyOtpMutation.isPending}
                >
                  <ShieldCheck className="ml-2 h-5 w-5" />
                  ورود
                </AppButton>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}