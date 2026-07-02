import { AppShell } from "@/components/app-shell";
import { isAuthed } from "@/server/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // When locked, render children bare (no shell). Middleware ensures only /db —
  // which shows the PIN gate — reaches this branch; other routes are redirected.
  if (!(await isAuthed())) return <>{children}</>;
  return <AppShell>{children}</AppShell>;
}
