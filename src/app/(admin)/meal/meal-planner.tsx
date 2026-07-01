"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Save, Users } from "lucide-react";
import { toast } from "sonner";

import { loadMealSelection, saveMeal } from "@/server/actions";
import { assignDiningRooms } from "@/lib/assignment";
import { MEAL_TYPES, ROOM_CAPACITY, type MealType } from "@/lib/constants";
import { formatDate } from "@/lib/date";
import type { Diner, EmployeeDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

import { DiningRoomCard } from "./dining-room-card";
import { EmployeePicker } from "./employee-picker";
import { GuestManager, type Guest } from "./guest-manager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MealPlannerProps {
  employees: EmployeeDTO[];
  defaultDate: string;
  initialSelection: { employeeIds: string[]; guests: Guest[] };
}

export function MealPlanner({ employees, defaultDate, initialSelection }: MealPlannerProps) {
  const router = useRouter();

  const [date, setDate] = useState(defaultDate);
  const [mealType, setMealType] = useState<MealType>("Lunch");
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelection.employeeIds),
  );
  const [guests, setGuests] = useState<Guest[]>(initialSelection.guests);
  const [isSaving, startSaving] = useTransition();
  const [isLoadingSelection, startLoading] = useTransition();

  const employeeMap = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);

  // Build the diner list and assign rooms — recomputed instantly on every change.
  const rooms = useMemo(() => {
    const diners: Diner[] = [];
    for (const id of selected) {
      const e = employeeMap.get(id);
      if (e) {
        diners.push({
          id: e.id,
          name: e.name,
          category: e.category,
          priority: e.priority,
          isGuest: false,
          employeeId: e.id,
        });
      }
    }
    for (const g of guests) {
      diners.push({
        id: g.id,
        name: g.name,
        category: "Guest",
        priority: -1,
        isGuest: true,
        employeeId: null,
      });
    }
    return assignDiningRooms(diners);
  }, [selected, guests, employeeMap]);

  const total = selected.size + guests.length;

  // "Briefly red then reassign": flash the counter when a new room opens.
  const prevRooms = useRef(rooms.length);
  const [overflowFlash, setOverflowFlash] = useState(false);
  useEffect(() => {
    if (rooms.length > prevRooms.current) {
      setOverflowFlash(true);
      const t = setTimeout(() => setOverflowFlash(false), 450);
      prevRooms.current = rooms.length;
      return () => clearTimeout(t);
    }
    prevRooms.current = rooms.length;
  }, [rooms.length]);

  // When date/meal-type changes, load any previously-saved selection.
  const isFirst = useRef(true);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    startLoading(async () => {
      const sel = await loadMealSelection(date, mealType);
      setSelected(new Set(sel.employeeIds));
      setGuests(sel.guests);
    });
  }, [date, mealType]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addGuest(name: string) {
    setGuests((prev) => [...prev, { id: `guest-${crypto.randomUUID()}`, name }]);
  }

  function save() {
    startSaving(async () => {
      const res = await saveMeal({
        date,
        mealType,
        employeeIds: [...selected],
        guests,
      });
      if (res.ok) {
        toast.success(`${mealType} plan saved`, {
          description: `${total} ${total === 1 ? "person" : "people"} · ${rooms.length} ${
            rooms.length === 1 ? "room" : "rooms"
          } · ${formatDate(date)}`,
        });
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to save");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Controls + live counter */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:w-auto">
            <div className="space-y-1.5">
              <Label htmlFor="mealType">Meal type</Label>
              <Select value={mealType} onValueChange={(v) => setMealType((v ?? "Lunch") as MealType)}>
                <SelectTrigger id="mealType" className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 sm:w-48"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Total selected
              </p>
              <p
                className={cn(
                  "font-mono text-3xl font-semibold tabular-nums transition-colors duration-300",
                  overflowFlash && "text-red-500",
                )}
              >
                {total}
                <span className="ml-1.5 text-base font-normal text-muted-foreground">
                  {total === 1 ? "person" : "people"}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Rooms
              </p>
              <p className="font-mono text-3xl font-semibold tabular-nums">{rooms.length}</p>
            </div>
            <Button size="lg" onClick={save} disabled={isSaving || total === 0}>
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Submit Meal Plan
            </Button>
          </div>
        </div>
      </Card>

      {/* Dining room preview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Dining rooms
          </h2>
          <span className="text-xs text-muted-foreground">
            Max {ROOM_CAPACITY} per room · guests seated first
          </span>
        </div>
        {rooms.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 border-dashed py-12 text-center">
            <Users className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Select employees below to see the dining room layout.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rooms.map((room) => (
              <DiningRoomCard key={room.room} room={room} />
            ))}
          </div>
        )}
      </section>

      {/* Guests */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Guests
        </h2>
        <Card className="p-4 sm:p-5">
          <GuestManager
            guests={guests}
            onAdd={addGuest}
            onRemove={(id) => setGuests((prev) => prev.filter((g) => g.id !== id))}
          />
        </Card>
      </section>

      {/* Employee picker */}
      <section className={cn("space-y-3", isLoadingSelection && "pointer-events-none opacity-60")}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Employees
          </h2>
          <span className="text-xs text-muted-foreground">
            {selected.size} selected · {employees.length} active
          </span>
        </div>
        <EmployeePicker
          employees={employees}
          selected={selected}
          onToggle={toggle}
          onSelectAll={(ids) => setSelected((prev) => new Set([...prev, ...ids]))}
          onClear={() => setSelected(new Set())}
        />
      </section>
    </div>
  );
}
