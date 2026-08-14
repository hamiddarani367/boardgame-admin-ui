import { useQuery } from "@tanstack/react-query";

interface UseProductsParams {
  page?: number;
  limit?: number;
  sort?: { key: string; order: "asc" | "desc" };
  filters?: Record<string, any>;
}

function normalizeValue(value: any): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.join(",");
  if (typeof value === "object") return String(value.value ?? value.id);
  return String(value);
}

async function fetchProducts(params: UseProductsParams) {
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

  const res = await fetch(`/api/products?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function useProducts(params: UseProductsParams = {}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => fetchProducts(params),
    staleTime: 0,
    refetchOnMount: true,
  });
}