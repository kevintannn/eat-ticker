"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { lockAdmin } from "@/server/actions";
import { Button } from "@/components/ui/button";

/** Clears the admin cookie and returns to the cook display. */
export function LockButton() {
  const router = useRouter();

  async function lock() {
    await lockAdmin();
    toast.success("Locked");
    router.push("/");
  }

  return (
    <Button variant="ghost" size="sm" onClick={lock} aria-label="Lock admin">
      <LogOut className="size-4" /> Lock
    </Button>
  );
}
