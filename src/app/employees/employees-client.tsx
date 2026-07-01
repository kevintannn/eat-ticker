"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteEmployee, setEmployeeActive } from "@/server/actions";
import type { EmployeeDTO } from "@/lib/types";
import { EMPLOYEE_CATEGORIES, type EmployeeCategory } from "@/lib/constants";

import { EmployeeForm } from "./employee-form";
import { CategoryBadge } from "@/components/category-badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

type SortKey = "name" | "department" | "category" | "priority";
type SortDir = "asc" | "desc";

const CATEGORY_ORDER: Record<string, number> = { Boss: 0, Manager: 1, Staff: 2 };

export function EmployeesClient({ employees }: { employees: EmployeeDTO[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<EmployeeCategory | "All">("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortKey, setSortKey] = useState<SortKey>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [createOpen, setCreateOpen] = useState(searchParams.get("new") === "1");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = employees.filter((e) => {
      const matchesSearch =
        !q ||
        e.name.toLowerCase().includes(q) ||
        (e.department?.toLowerCase().includes(q) ?? false);
      const matchesCategory = categoryFilter === "All" || e.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? e.active : !e.active);
      return matchesSearch && matchesCategory && matchesStatus;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case "priority":
          return (a.priority - b.priority) * dir;
        case "category":
          return ((CATEGORY_ORDER[a.category] ?? 99) - (CATEGORY_ORDER[b.category] ?? 99)) * dir;
        case "department":
          return (a.department ?? "").localeCompare(b.department ?? "") * dir;
        default:
          return a.name.localeCompare(b.name) * dir;
      }
    });
  }, [employees, search, categoryFilter, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  async function handleDelete(id: string) {
    const res = await deleteEmployee(id);
    if (res.ok) {
      toast.success("Employee deleted");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to delete");
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    const res = await setEmployeeActive(id, active);
    if (res.ok) {
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update");
    }
  }

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-left transition-colors hover:text-foreground"
    >
      {label}
      {sortKey === k ? (
        sortDir === "asc" ? (
          <ArrowUp className="size-3.5" />
        ) : (
          <ArrowDown className="size-3.5" />
        )
      ) : (
        <ChevronsUpDown className="size-3.5 opacity-40" />
      )}
    </button>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or department…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(v) => setCategoryFilter((v ?? "All") as EmployeeCategory | "All")}
          >
            <SelectTrigger className="sm:w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All categories</SelectItem>
              {EMPLOYEE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter((v ?? "all") as typeof statusFilter)}
          >
            <SelectTrigger className="sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <EmployeeForm
          open={createOpen}
          onOpenChange={setCreateOpen}
          trigger={
            <Button>
              <Plus className="size-4" /> Add employee
            </Button>
          }
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40">
              <TableHead>
                <SortHeader label="Name" k="name" />
              </TableHead>
              <TableHead className="hidden sm:table-cell">
                <SortHeader label="Department" k="department" />
              </TableHead>
              <TableHead>
                <SortHeader label="Category" k="category" />
              </TableHead>
              <TableHead className="text-right">
                <span className="flex justify-end">
                  <SortHeader label="Priority" k="priority" />
                </span>
              </TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground">
                  No employees found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((e) => (
                <TableRow key={e.id} className={e.active ? "" : "opacity-60"}>
                  <TableCell className="font-medium">{e.name}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {e.department ?? "—"}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge category={e.category} />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{e.priority}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={e.active}
                      onCheckedChange={(v) => handleToggleActive(e.id, v)}
                      aria-label="Toggle active"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <EmployeeForm
                        employee={e}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Edit">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <ConfirmDialog
                        title="Delete employee?"
                        description={`This permanently removes ${e.name}. Past meal records keep their saved snapshot.`}
                        confirmLabel="Delete"
                        destructive
                        onConfirm={() => handleDelete(e.id)}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Delete">
                            <Trash2 className="size-4" />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {employees.length} employees
      </p>
    </div>
  );
}
