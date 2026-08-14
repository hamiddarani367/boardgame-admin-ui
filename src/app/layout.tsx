import type { Metadata } from "next";
import "./globals.css";
import { iranYekan } from "./fonts";
import { Providers } from "./providers";
import { MainLayout } from "@/components/layout/MainLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "Board Kingdom",
    template: "%s | Board Kingdom",
  },
  description: "Board Game Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={`${iranYekan.variable} bg-background text-foreground antialiased`}>
        <TooltipProvider>
          <Providers>
              <Toaster richColors position="top-center" />
            <MainLayout>{children}</MainLayout>
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}