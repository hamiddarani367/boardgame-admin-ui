"use client";

import React, { useState } from "react";
import { useApiQuery } from "@/hooks/useApi";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

interface Permission {
  id: number;
  name: string;
}

interface PermissionSelectorProps {
  value: number[]; // شناسه‌های مجوزهای انتخابی
  onChange: (permissionIds: number[]) => void;
}

function groupPermissions(permissions: Permission[]): Record<string, Permission[]> {
  const groups: Record<string, Permission[]> = {};
  permissions.forEach((perm) => {
    const group = perm.name.split(".")[0] || "other";
    if (!groups[group]) groups[group] = [];
    groups[group].push(perm);
  });
  return groups;
}

export function PermissionSelector({ value, onChange }: PermissionSelectorProps) {
  const { data, isLoading } = useApiQuery<Permission[]>("/admin/permissions/all", ["permissions-list"]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const permissions = data ?? [];
  const groups = groupPermissions(permissions);

  const handleToggle = (permissionId: number) => {
    if (value.includes(permissionId)) {
      onChange(value.filter((id) => id !== permissionId));
    } else {
      onChange([...value, permissionId]);
    }
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        در حال بارگذاری دسترسی‌ها...
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      {Object.entries(groups).map(([group, perms]) => {
        const isExpanded = expandedGroups[group] ?? false;
        const groupIds = perms.map((p) => p.id);
        const selectedCount = groupIds.filter((id) => value.includes(id)).length;
        const allSelected = selectedCount === perms.length;

        return (
          <div key={group} className="border-b last:border-b-0">
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium hover:bg-muted/50"
            >
              <span className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      const newIds = [...value];
                      groupIds.forEach((id) => {
                        if (!newIds.includes(id)) newIds.push(id);
                      });
                      onChange(newIds);
                    } else {
                      onChange(value.filter((id) => !groupIds.includes(id)));
                    }
                  }}
                  className="h-4 w-4"
                />
                {group}
              </span>
              <span className="text-xs text-muted-foreground">
                {selectedCount}/{perms.length}
              </span>
            </button>
            {isExpanded && (
              <div className="space-y-1 px-6 py-2">
                {perms.map((perm) => (
                  <label key={perm.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={value.includes(perm.id)}
                      onCheckedChange={() => handleToggle(perm.id)}
                      className="h-4 w-4"
                    />
                    {perm.name}
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}