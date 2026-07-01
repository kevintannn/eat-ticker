import { z } from "zod";
import { EMPLOYEE_CATEGORIES, MEAL_TYPES } from "./constants";

export const employeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80, "Name is too long"),
  department: z
    .string()
    .trim()
    .max(80, "Department is too long")
    .optional()
    .transform((v) => (v ? v : null)),
  category: z.enum(EMPLOYEE_CATEGORIES),
  priority: z.coerce
    .number({ message: "Priority must be a number" })
    .int("Priority must be a whole number")
    .min(1, "Priority must be at least 1")
    .max(100000, "Priority is too large"),
  active: z.boolean().default(true),
});

export type EmployeeInput = z.input<typeof employeeSchema>;
export type EmployeeValues = z.output<typeof employeeSchema>;

/** A guest added ad-hoc to a single meal. */
export const guestSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Guest name is required").max(80),
});

export const saveMealSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  mealType: z.enum(MEAL_TYPES),
  employeeIds: z.array(z.string()).default([]),
  guests: z.array(guestSchema).default([]),
});

export type SaveMealInput = z.input<typeof saveMealSchema>;
export type SaveMealValues = z.output<typeof saveMealSchema>;
