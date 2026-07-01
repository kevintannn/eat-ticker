// Central place for tunable business rules and shared enums-as-constants.
// Kept as plain string unions (not Prisma enums) so the schema stays portable
// between SQLite (dev) and Postgres (prod).

export const ROOM_CAPACITY = 12;

export const MEAL_TYPES = ["Lunch", "Dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

/** Categories an Employee can belong to. */
export const EMPLOYEE_CATEGORIES = ["Boss", "Manager", "Staff"] as const;
export type EmployeeCategory = (typeof EMPLOYEE_CATEGORIES)[number];

/** All categories that can appear in a dining room (employees + one-off guests). */
export const DINER_CATEGORIES = ["Boss", "Manager", "Staff", "Guest"] as const;
export type DinerCategory = (typeof DINER_CATEGORIES)[number];

/** Guests always outrank everyone, so they seat first. Employees never use this. */
export const GUEST_PRIORITY = -1;
