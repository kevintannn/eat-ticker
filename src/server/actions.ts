"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { assignDiningRooms } from "@/lib/assignment";
import { GUEST_PRIORITY } from "@/lib/constants";
import { dateKeyToUTC } from "@/lib/date";
import type { Diner } from "@/lib/types";
import { employeeSchema, saveMealSchema } from "@/lib/validators";
import { ADMIN_COOKIE, computeToken } from "@/lib/auth";
import { isAuthed } from "@/server/auth";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

/** Reject mutations from a locked session (defends against direct action calls). */
async function ensureAuthed(): Promise<ActionResult<never> | null> {
  if (await isAuthed()) return null;
  return { ok: false, error: "Unauthorized. Enter the admin PIN first." };
}

// --- Admin PIN gate ----------------------------------------------------------

export async function unlockAdmin(pin: string): Promise<ActionResult> {
  const expected = process.env.ADMIN_PIN;
  if (!expected) return { ok: false, error: "Admin PIN is not configured on the server." };
  if (pin !== expected) return { ok: false, error: "Incorrect PIN." };

  const store = await cookies();
  store.set(ADMIN_COOKIE, await computeToken(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return { ok: true };
}

export async function lockAdmin(): Promise<ActionResult> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
  return { ok: true };
}

// --- Employees ---------------------------------------------------------------

export async function createEmployee(input: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await ensureAuthed();
  if (denied) return denied;
  const parsed = employeeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const employee = await prisma.employee.create({ data: parsed.data });
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/db");
  return { ok: true, data: { id: employee.id } };
}

export async function updateEmployee(id: string, input: unknown): Promise<ActionResult> {
  const denied = await ensureAuthed();
  if (denied) return denied;
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
  revalidatePath("/db");
  return { ok: true };
}

export async function deleteEmployee(id: string): Promise<ActionResult> {
  const denied = await ensureAuthed();
  if (denied) return denied;
  try {
    await prisma.employee.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Employee not found" };
  }
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/db");
  return { ok: true };
}

export async function setEmployeeActive(id: string, active: boolean): Promise<ActionResult> {
  const denied = await ensureAuthed();
  if (denied) return denied;
  try {
    await prisma.employee.update({ where: { id }, data: { active } });
  } catch {
    return { ok: false, error: "Employee not found" };
  }
  revalidatePath("/employees");
  revalidatePath("/meal");
  revalidatePath("/db");
  return { ok: true };
}

// --- Meals -------------------------------------------------------------------

export async function saveMeal(input: unknown): Promise<ActionResult<{ id: string }>> {
  const denied = await ensureAuthed();
  if (denied) return denied;
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
  revalidatePath("/db");
  revalidatePath("/meal");
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
  const denied = await ensureAuthed();
  if (denied) return denied;
  try {
    await prisma.meal.delete({ where: { id } });
  } catch {
    return { ok: false, error: "Meal not found" };
  }
  revalidatePath("/");
  revalidatePath("/db");
  return { ok: true };
}
