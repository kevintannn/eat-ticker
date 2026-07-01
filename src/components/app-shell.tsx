"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, UtensilsCrossed } from "lucide-react";

import { NAV_ITEMS } from "@/components/nav-items";
import { ThemeToggle } from "@/components/theme-toggle";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname }: { pathname: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/db" className="flex items-center gap-2 font-semibold tracking-tight">
      <span className="flex size-7 items-center justify-center rounded-lg bg-foreground text-background">
        <UtensilsCrossed className="size-4" />
      </span>
      Eat Ticker
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const palette = useCommandPalette();

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-card px-4 py-5 md:flex">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-8 flex-1">
          <NavLinks pathname={pathname} />
        </div>
        <button
          onClick={palette.open}
          className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="flex items-center gap-2">
            <Search className="size-4" /> Search
          </span>
          <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </button>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col md:pl-60">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-background/80 px-4 py-3 backdrop-blur md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" aria-label="Menu" />
              }
            >
              <Menu className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={href}
                  render={<Link href={href} />}
                  className="flex items-center gap-2"
                >
                  <Icon className="size-4" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Brand />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Search" onClick={palette.open}>
              <Search className="size-5" />
            </Button>
            <ThemeToggle />
          </div>
        </header>

        {/* Desktop top-right controls */}
        <div className="hidden items-center justify-end gap-1 border-b px-6 py-3 md:flex">
          <ThemeToggle />
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-10">
          {children}
        </main>
      </div>

      <CommandPalette controller={palette} />
    </div>
  );
}
