import type { DinerCategory, EmployeeCategory, MealType } from "./constants";

/** A person to be seated — either a selected employee or a one-off guest. */
export interface Diner {
  /** Employee id, or a client-generated id for guests (e.g. "guest-abc"). */
  id: string;
  name: string;
  category: DinerCategory;
  priority: number;
  isGuest: boolean;
  employeeId: string | null;
}

/** Per-category headcount for a dining room. */
export interface CategoryCounts {
  Boss: number;
  Manager: number;
  Staff: number;
  Guest: number;
}

/** One dining room after the assignment algorithm has run. */
export interface DiningRoom {
  /** 1-based room number. */
  room: number;
  diners: Diner[];
  counts: CategoryCounts;
}

/** Serializable employee shape used across the client/server boundary. */
export interface EmployeeDTO {
  id: string;
  name: string;
  department: string | null;
  category: EmployeeCategory;
  priority: number;
  active: boolean;
  createdAt: string;
}

/** A saved meal summarized for the dashboard table. */
export interface MealSummary {
  id: string;
  date: string;
  mealType: MealType;
  total: number;
  roomsUsed: number;
  boss: number;
  manager: number;
  staff: number;
  guest: number;
  createdAt: string;
}
