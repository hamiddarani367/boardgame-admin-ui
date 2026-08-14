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
import { LogIn, ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react";

// تعریف schema برای مرحله اول
const loginStep1Schema = z.object({
  phone: z.string().min(11, "شماره موبایل ۱۱ رقم باشد").max(11, "شماره موبایل ۱۱ رقم باشد"),
  password: z.string().min(6, "رمز عبور حداقل ۶ کاراکتر"),
});

// تعریف schema برای مرحله دوم
const loginStep2Schema = z.object({
  code: z.string().min(4, "کد تأیید معتبر نیست").max(6, "کد تأیید معتبر نیست"),
});

type Step1Values = z.infer<typeof loginStep1Schema>;
type Step2Values = z.infer<typeof loginStep2Schema>;

export default function LoginPage() {
  const router = useRouter();
  const auth = useContext(AuthContext);

  const [step, setStep] = useState<1 | 2>(1);
  const [credentials, setCredentials] = useState<Step1Values | null>(null);

  // Mutation مرحله اول
  const loginMutation = useApiMutation<
    { success: boolean },
    { phone: string; password: string }
  >("/auth/login", "POST");

  // Mutation مرحله دوم
  const verifyMutation = useApiMutation<
    { access_token: string; refresh_token: string; user: any },
    { phone: string; password: string; code: string }
  >("/auth/verify-otp", "POST");

  // فرم مرحله اول
  const step1Form = useForm<Step1Values>({
    resolver: zodResolver(loginStep1Schema),
    defaultValues: { phone: "", password: "" },
  });

  // فرم مرحله دوم
  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(loginStep2Schema),
    defaultValues: { code: "" },
  });

  const onSubmitStep1 = async (data: Step1Values) => {
    try {
      await loginMutation.mutateAsync({ phone: data.phone, password: data.password });
      setCredentials(data); // ذخیره اطلاعات برای مرحله بعد
      setStep(2);
      toast.success("کد تأیید ارسال شد");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "شماره موبایل یا رمز عبور اشتباه است");
    }
  };

  const onSubmitStep2 = async (data: Step2Values) => {
    if (!credentials) return;
    try {
      const response = await verifyMutation.mutateAsync({
        phone: credentials.phone,
        password: credentials.password,
        code: data.code,
      });

      // ذخیره‌سازی توکن‌ها و کاربر در AuthContext
      auth?.login(
        response.access_token,
        response.refresh_token,
        response.user
      );

      toast.success("ورود موفقیت‌آمیز بود");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "کد تأیید نامعتبر است");
    }
  };

  const goBack = () => {
    setStep(1);
    step2Form.reset();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md rounded-none shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-800">
            {step === 1 ? "ورود به پنل مدیریت" : "تأیید هویت"}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Board Kingdom</p>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-6">
              {/* شماره موبایل */}
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
                  <p className="text-xs text-red-500">{step1Form.formState.errors.phone.message}</p>
                )}
              </div>

              {/* رمز عبور */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">رمز عبور *</label>
                <Controller
                  name="password"
                  control={step1Form.control}
                  render={({ field }) => (
                    <AppInput
                      type="password"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="••••••"
                      dir="ltr"
                      className="h-12"
                    />
                  )}
                />
                {step1Form.formState.errors.password && (
                  <p className="text-xs text-red-500">{step1Form.formState.errors.password.message}</p>
                )}
              </div>

              <AppButton
                type="submit"
                variant="blue"
                className="w-full h-12 text-base"
                loading={loginMutation.isPending}
              >
                <ArrowRight className="ml-2 h-5 w-5" />
                ادامه
              </AppButton>
            </form>
          ) : (
            <form onSubmit={step2Form.handleSubmit(onSubmitStep2)} className="space-y-6">
              <div className="text-center text-sm text-muted-foreground">
                کد تأیید به شماره <span dir="ltr">{credentials?.phone}</span> ارسال شد.
              </div>

              {/* کد تأیید */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">کد تأیید *</label>
                <Controller
                  name="code"
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
                {step2Form.formState.errors.code && (
                  <p className="text-xs text-red-500">{step2Form.formState.errors.code.message}</p>
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
                  loading={verifyMutation.isPending}
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