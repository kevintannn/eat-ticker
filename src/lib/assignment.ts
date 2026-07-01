import { ROOM_CAPACITY } from "./constants";
import type { CategoryCounts, Diner, DiningRoom } from "./types";

/**
 * Deterministic seating order:
 *   1. Guests always come first (they outrank everyone).
 *   2. Then employees by priority ascending (lower number = higher priority).
 *   3. Ties broken by name, then id — so the result is stable and never "splits
 *      differently" between renders.
 */
export function sortDiners(diners: Diner[]): Diner[] {
  return [...diners].sort((a, b) => {
    if (a.isGuest !== b.isGuest) return a.isGuest ? -1 : 1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    const byName = a.name.localeCompare(b.name);
    if (byName !== 0) return byName;
    return a.id.localeCompare(b.id);
  });
}

function emptyCounts(): CategoryCounts {
  return { Boss: 0, Manager: 0, Staff: 0, Guest: 0 };
}

function countByCategory(diners: Diner[]): CategoryCounts {
  return diners.reduce((counts, d) => {
    counts[d.category] += 1;
    return counts;
  }, emptyCounts());
}

/**
 * Assign diners into dining rooms of at most ROOM_CAPACITY (12) each.
 *
 * Sort by priority, then fill Room 1 with the first 12, Room 2 with the next 12,
 * and so on — the lowest priority numbers stay in Room 1, the largest overflow
 * into later rooms. Grows to as many rooms as needed.
 */
export function assignDiningRooms(diners: Diner[], capacity = ROOM_CAPACITY): DiningRoom[] {
  const sorted = sortDiners(diners);
  const rooms: DiningRoom[] = [];

  for (let i = 0; i < sorted.length; i += capacity) {
    const chunk = sorted.slice(i, i + capacity);
    rooms.push({
      room: rooms.length + 1,
      diners: chunk,
      counts: countByCategory(chunk),
    });
  }

  return rooms;
}

/** How many rooms a given headcount requires (used for previews/labels). */
export function roomsNeeded(total: number, capacity = ROOM_CAPACITY): number {
  return Math.ceil(total / capacity);
}
