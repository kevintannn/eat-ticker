"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X } from "lucide-react";

import type { MealSummary } from "@/lib/types";
import type { EmployeeDTO } from "@/lib/types";
import { MEAL_TYPES, DINER_CATEGORIES } from "@/lib/constants";
import { formatDate, formatDateTime } from "@/lib/date";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface HistoryFilters {
  date: string;
  mealType: string;
  category: string;
  employeeId: string;
}

interface HistoryTableProps {
  meals: MealSummary[];
  employees: EmployeeDTO[];
  filters: HistoryFilters;
}

export function HistoryTable({ meals, employees, filters }: HistoryTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function applyFilter(patch: Partial<HistoryFilters>) {
    const next = { ...filters, ...patch };
    const params = new URLSearchParams();
    if (next.date) params.set("date", next.date);
    if (next.mealType && next.mealType !== "All") params.set("mealType", next.mealType);
    if (next.category && next.category !== "All") params.set("category", next.category);
    if (next.employeeId && next.employeeId !== "All") params.set("employeeId", next.employeeId);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `/?${qs}` : "/", { scroll: false }));
  }

  const hasFilters =
    filters.date ||
    (filters.mealType && filters.mealType !== "All") ||
    (filters.category && filters.category !== "All") ||
    (filters.employeeId && filters.employeeId !== "All");

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={filters.date}
          onChange={(e) => applyFilter({ date: e.target.value })}
          className="w-auto"
        />
        <Select
          value={filters.mealType || "All"}
          onValueChange={(v) => applyFilter({ mealType: v ?? "All" })}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Meal type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All meals</SelectItem>
            {MEAL_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.category || "All"}
          onValueChange={(v) => applyFilter({ category: v ?? "All" })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All categories</SelectItem>
            {DINER_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.employeeId || "All"}
          onValueChange={(v) => applyFilter({ employeeId: v ?? "All" })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All employees</SelectItem>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              applyFilter({ date: "", mealType: "All", category: "All", employeeId: "All" })
            }
          >
            <X className="size-4" /> Clear
          </Button>
        ) : null}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border" data-pending={isPending || undefined}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>Date</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead className="text-right">Eating</TableHead>
              <TableHead className="text-right">Rooms</TableHead>
              <TableHead className="hidden text-right md:table-cell">Boss</TableHead>
              <TableHead className="hidden text-right md:table-cell">Manager</TableHead>
              <TableHead className="hidden text-right md:table-cell">Staff</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Guest</TableHead>
              <TableHead className="hidden text-muted-foreground lg:table-cell">Created</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {meals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                  No meals match these filters.
                </TableCell>
              </TableRow>
            ) : (
              meals.map((m) => (
                <TableRow
                  key={m.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/meals/${m.id}`)}
                >
                  <TableCell className="font-medium">{formatDate(m.date)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{m.mealType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{m.total}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{m.roomsUsed}</TableCell>
                  <TableCell className="hidden text-right font-mono tabular-nums md:table-cell">
                    {m.boss}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono tabular-nums md:table-cell">
                    {m.manager}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono tabular-nums md:table-cell">
                    {m.staff}
                  </TableCell>
                  <TableCell className="hidden text-right font-mono tabular-nums lg:table-cell">
                    {m.guest}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    {formatDateTime(m.createdAt)}
                  </TableCell>
                  <TableCell>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
