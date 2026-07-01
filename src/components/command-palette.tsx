"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { LayoutDashboard, Moon, Sun, UserPlus, Users, UtensilsCrossed } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export interface PaletteController {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  setOpen: (v: boolean) => void;
}

/** Global Ctrl/⌘+K handler + open state. */
export function useCommandPalette(): PaletteController {
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    isOpen,
    open: useCallback(() => setOpen(true), []),
    close: useCallback(() => setOpen(false), []),
    setOpen,
  };
}

export function CommandPalette({ controller }: { controller: PaletteController }) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const run = useCallback(
    (action: () => void) => {
      controller.close();
      action();
    },
    [controller],
  );

  return (
    <CommandDialog open={controller.isOpen} onOpenChange={controller.setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => router.push("/"))}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/meal"))}>
            <UtensilsCrossed className="size-4" />
            Today&apos;s Meal
          </CommandItem>
          <CommandItem onSelect={() => run(() => router.push("/employees"))}>
            <Users className="size-4" />
            Employees
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(() => router.push("/employees?new=1"))}>
            <UserPlus className="size-4" />
            New employee
          </CommandItem>
          <CommandItem
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
