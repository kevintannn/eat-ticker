import "server-only";

import { prisma } from "@/lib/prisma";
import { toDateKey } from "@/lib/date";
import { roomsNeeded } from "@/lib/assignment";
import type { EmployeeCategory, MealType } from "@/lib/constants";
import type { CategoryCounts, EmployeeDTO, MealSummary } from "@/lib/types";

// --- Employees ---------------------------------------------------------------

export interface EmployeeFilter {
  search?: string;
  category?: EmployeeCategory | "All";
  status?: "all" | "active" | "inactive";
}

function toEmployeeDTO(e: {
  id: string;
  name: string;
  department: string | null;
  category: string;
  priority: number;
  active: boolean;
  createdAt: Date;
}): EmployeeDTO {
  return {
    id: e.id,
    name: e.name,
    department: e.department,
    category: e.category as EmployeeCategory,
    priority: e.priority,
    active: e.active,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function getEmployees(filter: EmployeeFilter = {}): Promise<EmployeeDTO[]> {
  const employees = await prisma.employee.findMany({
    where: {
      ...(filter.category && filter.category !== "All" ? { category: filter.category } : {}),
      ...(filter.status === "active"
        ? { active: true }
        : filter.status === "inactive"
          ? { active: false }
          : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search } },
              { department: { contains: filter.search } },
            ],
          }
        : {}),
    },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
  return employees.map(toEmployeeDTO);
}

export async function getActiveEmployees(): Promise<EmployeeDTO[]> {
  const employees = await prisma.employee.findMany({
    where: { active: true },
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
  return employees.map(toEmployeeDTO);
}

export async function getEmployeeCounts() {
  const [total, active] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { active: true } }),
  ]);
  return { total, active };
}

// --- Meals -------------------------------------------------------------------

function countCategories(assignments: { category: string }[]): CategoryCounts {
  const counts: CategoryCounts = { Boss: 0, Manager: 0, Staff: 0, Guest: 0 };
  for (const a of assignments) {
    counts[a.category as keyof CategoryCounts] += 1;
  }
  return counts;
}

export interface MealFilter {
  date?: string;
  mealType?: MealType | "All";
  category?: EmployeeCategory | "Guest" | "All";
  employeeId?: string;
}

export async function getMealSummaries(filter: MealFilter = {}): Promise<MealSummary[]> {
  const meals = await prisma.meal.findMany({
    where: {
      ...(filter.date ? { date: new Date(`${filter.date}T00:00:00.000Z`) } : {}),
      ...(filter.mealType && filter.mealType !== "All" ? { mealType: filter.mealType } : {}),
      ...(filter.category && filter.category !== "All"
        ? { assignments: { some: { category: filter.category } } }
        : {}),
      ...(filter.employeeId
        ? { assignments: { some: { employeeId: filter.employeeId } } }
        : {}),
    },
    include: { assignments: { select: { category: true, diningRoom: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return meals.map((m) => {
    const counts = countCategories(m.assignments);
    const roomsUsed = m.assignments.reduce((max, a) => Math.max(max, a.diningRoom), 0);
    return {
      id: m.id,
      date: toDateKey(m.date),
      mealType: m.mealType as MealType,
      total: m.assignments.length,
      roomsUsed: roomsUsed || roomsNeeded(m.assignments.length),
      boss: counts.Boss,
      manager: counts.Manager,
      staff: counts.Staff,
      guest: counts.Guest,
      createdAt: m.createdAt.toISOString(),
    };
  });
}

export async function getMealDetail(id: string) {
  const meal = await prisma.meal.findUnique({
    where: { id },
    include: {
      assignments: {
        orderBy: [{ diningRoom: "asc" }, { priority: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!meal) return null;

  const roomNumbers = [...new Set(meal.assignments.map((a) => a.diningRoom))].sort((a, b) => a - b);
  const rooms = roomNumbers.map((room) => {
    const diners = meal.assignments.filter((a) => a.diningRoom === room);
    return {
      room,
      counts: countCategories(diners),
      diners: diners.map((d) => ({
        id: d.id,
        name: d.name,
        category: d.category,
        priority: d.priority,
        isGuest: d.isGuest,
      })),
    };
  });

  return {
    id: meal.id,
    date: toDateKey(meal.date),
    mealType: meal.mealType as MealType,
    total: meal.assignments.length,
    createdAt: meal.createdAt.toISOString(),
    rooms,
  };
}

export type MealDetail = NonNullable<Awaited<ReturnType<typeof getMealDetail>>>;

/** Today's saved meals keyed by type, for the dashboard summary cards. */
export async function getTodayMeals(dateKey: string) {
  const meals = await prisma.meal.findMany({
    where: { date: new Date(`${dateKey}T00:00:00.000Z`) },
    include: { assignments: { select: { diningRoom: true } } },
  });
  const summarize = (type: MealType) => {
    const meal = meals.find((m) => m.mealType === type);
    if (!meal) return null;
    const roomsUsed = meal.assignments.reduce((max, a) => Math.max(max, a.diningRoom), 0);
    return { total: meal.assignments.length, roomsUsed, id: meal.id };
  };
  return { Lunch: summarize("Lunch"), Dinner: summarize("Dinner") };
}

// --- Dashboard charts --------------------------------------------------------

export async function getChartData() {
  const meals = await prisma.meal.findMany({
    include: { assignments: { select: { category: true, diningRoom: true } } },
    orderBy: { date: "asc" },
  });

  const byDate = new Map<
    string,
    { lunch: number; dinner: number; counts: CategoryCounts; rooms: number }
  >();

  for (const m of meals) {
    const key = toDateKey(m.date);
    const entry =
      byDate.get(key) ??
      { lunch: 0, dinner: 0, counts: { Boss: 0, Manager: 0, Staff: 0, Guest: 0 }, rooms: 0 };

    if (m.mealType === "Lunch") entry.lunch += m.assignments.length;
    else entry.dinner += m.assignments.length;

    const counts = countCategories(m.assignments);
    entry.counts.Boss += counts.Boss;
    entry.counts.Manager += counts.Manager;
    entry.counts.Staff += counts.Staff;
    entry.counts.Guest += counts.Guest;

    const roomsUsed = m.assignments.reduce((max, a) => Math.max(max, a.diningRoom), 0);
    entry.rooms += roomsUsed;

    byDate.set(key, entry);
  }

  const dates = [...byDate.keys()].sort();
  return dates.map((date) => {
    const e = byDate.get(date)!;
    return {
      date,
      lunch: e.lunch,
      dinner: e.dinner,
      Boss: e.counts.Boss,
      Manager: e.counts.Manager,
      Staff: e.counts.Staff,
      Guest: e.counts.Guest,
      rooms: e.rooms,
    };
  });
}
