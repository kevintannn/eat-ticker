import { LayoutDashboard, UtensilsCrossed, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/meal", label: "Today's Meal", icon: UtensilsCrossed },
  { href: "/employees", label: "Employees", icon: Users },
];
