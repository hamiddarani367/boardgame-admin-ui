"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/providers/AuthProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient را در state نگه می‌داریم تا در طول عمر کامپوننت ثابت بماند
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,       // ۵ دقیقه
            retry: 1,                        // یک بار تلاش مجدد
            refetchOnWindowFocus: false,      // در فوکوس refetch نکن (اختیاری)
          },
        },
      })
  );

  return (
    <AuthProvider>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </Provider>
    </AuthProvider>
  );
}