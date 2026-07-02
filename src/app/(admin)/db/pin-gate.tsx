"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { toast } from "sonner";

import { unlockAdmin } from "@/server/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(false);
  const unlocked = useRef(false);

  const attempt = useCallback(
    async (value: string, explicit: boolean) => {
      if (unlocked.current || !value.trim()) return;
      const res = await unlockAdmin(value);
      if (res.ok) {
        unlocked.current = true;
        setChecking(true);
        toast.success("Unlocked");
        router.refresh();
        return;
      }
      // Stay quiet on auto-attempts (partial/incorrect PIN); only the explicit
      // submit surfaces an error.
      if (explicit) {
        setError(true);
        setPin("");
        toast.error(res.error ?? "Incorrect PIN");
      }
    },
    [router],
  );

  // Auto-check shortly after typing stops, and unlock as soon as it matches.
  useEffect(() => {
    if (!pin.trim() || unlocked.current) return;
    const t = setTimeout(() => attempt(pin, false), 250);
    return () => clearTimeout(t);
  }, [pin, attempt]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-secondary">
            <Lock className="size-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter the shared PIN — it unlocks automatically.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            attempt(pin, true);
          }}
          className="mt-6 space-y-3"
        >
          <Input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            placeholder="••••"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError(false);
            }}
            aria-invalid={error}
            disabled={checking}
            className="text-center text-lg tracking-[0.4em]"
          />
          <Button type="submit" variant="outline" className="w-full" disabled={checking || !pin.trim()}>
            {checking ? "Unlocking…" : "Unlock"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
