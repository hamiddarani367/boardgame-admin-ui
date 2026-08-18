import { useApiQuery } from "@/hooks/useApi";

export interface Role {
  id: number;
  name: string;
}

export function useRoles() {
  return useApiQuery<Role[]>("/roles/all", ["roles"]);
}