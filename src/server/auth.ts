import "server-only";

import { cookies } from "next/headers";

import { ADMIN_COOKIE, isValidToken } from "@/lib/auth";

/** Whether the current request is unlocked (or the gate is disabled). */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return isValidToken(store.get(ADMIN_COOKIE)?.value);
}
