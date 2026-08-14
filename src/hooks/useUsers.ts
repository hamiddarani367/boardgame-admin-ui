import { useQuery } from "@tanstack/react-query";

export interface User {
  id: number;
  name: string;
  mobile: string;
  roles: { id: number; title: string }[];
  is_active: boolean;
}

interface UseUsersParams {
  page?: number;
  limit?: number;
  sort?: { key: string; order: "asc" | "desc" };
  filters?: Record<string, any>;
}

function normalizeValue(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    return value
      .map((item) => (typeof item === "object" && item !== null ? (item.value ?? item.id) : item))
      .join(",");
  }
  if (typeof value === "object" && value !== null) {
    return String(value.value ?? value.id);
  }
  return String(value);
}

async function fetchUsers(params: UseUsersParams) {
  const { page = 1, limit = 10, sort, filters = {} } = params;
  const query = new URLSearchParams();
  query.set("page", String(page));
  query.set("limit", String(limit));
  if (sort) {
    query.set("sortBy", sort.key);
    query.set("sortOrder", sort.order);
  }
  Object.entries(filters).forEach(([key, value]) => {
    const normalized = normalizeValue(value);
    if (normalized !== null) query.set(key, normalized);
  });

  const res = await fetch(`/api/users?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export function useUsers(params: UseUsersParams = {}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => fetchUsers(params),
    staleTime: 0,          // ⬅️ همیشه تازه
    refetchOnMount: true,  // ⬅️ در هر mount دوباره fetch کن
  });
}