import { useQuery } from "@tanstack/react-query";

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  revenue: number;
  growthPercent: number;
}

export interface Order {
  id: string;
  customer: string;
  date: string;
  amount: number;
  status: string;
}

interface DashboardResponse {
  stats: DashboardStats;
  orders: Order[];
  totalOrders: number;
}

async function fetchDashboardStats(
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: string
): Promise<DashboardResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy,
    sortOrder,
  });
  const res = await fetch(`/api/stats?${params.toString()}`);
  if (!res.ok) throw new Error("خطا در دریافت اطلاعات");
  return res.json();
}

export function useDashboardStats(
  page: number = 1,
  limit: number = 10,
  sortBy: string = "id",
  sortOrder: string = "asc"
) {
  return useQuery<DashboardResponse>({
    queryKey: ["dashboard-stats", page, limit, sortBy, sortOrder],
    queryFn: () => fetchDashboardStats(page, limit, sortBy, sortOrder),
    staleTime: 5 * 60 * 1000,
  });
}