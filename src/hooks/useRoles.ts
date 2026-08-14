import { useQuery } from "@tanstack/react-query";

interface Role {
  id: number;
  title: string;
}

async function fetchRoles(): Promise<Role[]> {
  const res = await fetch("/api/roles");
  if (!res.ok) throw new Error("خطا در دریافت نقش‌ها");
  const data = await res.json();
  return data.roles;
}

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: fetchRoles,
    staleTime: 10 * 60 * 1000,
  });
}