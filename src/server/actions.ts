"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { assignDiningRooms } from "@/lib/assignment";
import { GUEST_PRIORITY } from "@/lib/constants";
import { dateKeyToUTC } from "@/lib/date";
import type { Diner } from "@/lib/types";
import { employeeSchema, saveMealSchema } from "@/lib/validators";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

// --- Employees ---------------------------------------------------------------

export async function createEmployee(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const employee = await prisma.employee.create({ data: parsed.data });
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/");
  return { ok: true, data: { id: employee.id } };
}

export async function updateEmployee(id: string, input: unknown): Promise<ActionResult> {
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    await prisma.employee.update({ where: { id }, data: parsed.data });
  } catch {
    return { ok: false, error: "Employee not found" };
  }
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  try {
    await prisma.employee.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Employee not found" };
  }
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/");
  return { ok: true };
}

export async function setEmployeeActive(id: string, active: boolean): Promise<ActionResult> {
  try {
    await prisma.employee.update({ where: { id }, data: { active } });
  } catch {
    return { ok: false, error: "Employee not found" };
  }
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/");
  return { ok: true };
}

// --- Meals -------------------------------------------------------------------

export async function saveMeal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = saveMealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { date, mealType, employeeIds, guests } = parsed.data;

  if (employeeIds.length === 0 && guests.length === 0) {
    return { ok: false, error: "Select at least one diner before saving." };
  }

  // Snapshot authoritative employee data from the DB (ignore stale client values).
  const employees = await prisma.employee.findMany({ where: { id: { in: employeeIds } } });

  const diners: Diner[] = [
    ...employees.map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category as Diner["category"],
      priority: e.priority,
      isGuest: false,
      employeeId: e.id,
    })),
    ...guests.map((g) => ({
      id: g.id,
      name: g.name,
      category: "Guest" as const,
      priority: GUEST_PRIORITY,
      isGuest: true,
      employeeId: null,
    })),
  ];

  const rooms = assignDiningRooms(diners);
  const assignments = rooms.flatMap((room) =>
    room.diners.map((d) => ({
      employeeId: d.employeeId,
      name: d.name,
      category: d.category,
      priority: d.priority,
      isGuest: d.isGuest,
      diningRoom: room.room,
    })),
  );

  const normalizedDate = dateKeyToUTC(date);

  const meal = await prisma.$transaction(async (tx) => {
    const m = await tx.meal.upsert({
      where: { date_mealType: { date: normalizedDate, mealType } },
      create: { date: normalizedDate, mealType },
      update: {},
    });
    await tx.mealAssignment.deleteMany({ where: { mealId: m.id } });
    await tx.mealAssignment.createMany({
      data: assignments.map((a) => ({ ...a, mealId: m.id })),
    });
    return m;
  });

  revalidatePath("/");
  revalidatePath("/meal");
  revalidatePath("/dashboard");
  return { ok: true, data: { id: meal.id } };
}

/** Load a previously-saved selection so the planner can edit an existing meal. */
export async function loadMealSelection(
  date: string,
  mealType: string,
): Promise<{ employeeIds: string[]; guests: { id: string; name: string }[] }> {
  const meal = await prisma.meal.findUnique({
    where: { date_mealType: { date: dateKeyToUTC(date), mealType } },
    include: { assignments: true },
  });
  if (!meal) return { employeeIds: [], guests: [] };

  return {
    employeeIds: meal.assignments
      .filter((a) => !a.isGuest && a.employeeId)
      .map((a) => a.employeeId as string),
    guests: meal.assignments
      .filter((a) => a.isGuest)
      .map((a) => ({ id: a.id, name: a.name })),
  };
}

export async function deleteMeal(id: string): Promise<ActionResult> {
  try {
    await prisma.meal.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Meal not found" };
  }
  revalidatePath("/");
  revalidatePath("/dashboard");
  return { ok: true };
}
