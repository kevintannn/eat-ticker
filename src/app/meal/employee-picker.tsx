"use client";

import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { EmployeeDTO } from "@/lib/types";

interface EmployeePickerProps {
  employees: EmployeeDTO[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: (ids: string[]) => void;
  onClear: () => void;
}

export function EmployeePicker({
  employees,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: EmployeePickerProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || (e.department?.toLowerCase().includes(q) ?? false),
    );
  }, [employees, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSelectAll(filtered.map((e) => e.id))}
          >
            Select all
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No employees match.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((e) => {
            const isSelected = selected.has(e.id);
            return (
              <button
                key={e.id}
                type="button"
                onClick={() => onToggle(e.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-all",
                  "hover:border-foreground/20 hover:shadow-sm",
                  isSelected && "border-foreground/40 bg-secondary/50 ring-1 ring-foreground/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    isSelected
                      ? "border-transparent bg-foreground text-background"
                      : "border-input bg-background",
                  )}
                >
                  {isSelected ? <Check className="size-3.5" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{e.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{e.department ?? "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <CategoryBadge category={e.category} />
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    #{e.priority}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
