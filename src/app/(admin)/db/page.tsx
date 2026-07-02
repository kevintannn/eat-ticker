import { Moon, Sun, Users, UserCheck } from "lucide-react";

import {
  getChartData,
  getEmployeeCounts,
  getEmployees,
  getMealSummaries,
  getTodayMeals,
  type MealFilter,
} from "@/server/queries";
import { todayKey } from "@/lib/date";
import type { EmployeeCategory, MealType } from "@/lib/constants";
import { isAuthed } from "@/server/auth";

import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { DashboardCharts } from "./dashboard-charts";
import { HistoryTable } from "./history-table";
import { PinGate } from "./pin-gate";

export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<{
    date?: string;
    mealType?: string;
    category?: string;
    employeeId?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  if (!(await isAuthed())) return <PinGate />;

  const sp = await searchParams;
  const filter: MealFilter = {
    date: sp.date || undefined,
    mealType: (sp.mealType as MealType | undefined) || undefined,
    category: (sp.category as EmployeeCategory | "Guest" | undefined) || undefined,
    employeeId: sp.employeeId || undefined,
  };

  const today = todayKey();
  const [counts, todayMeals, chartData, meals, employees] = await Promise.all([
    getEmployeeCounts(),
    getTodayMeals(today),
    getChartData(),
    getMealSummaries(filter),
    getEmployees(),
  ]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Attendance overview and dining history at a glance."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Today's Lunch"
          value={todayMeals.Lunch ? todayMeals.Lunch.total : "—"}
          hint={todayMeals.Lunch ? `${todayMeals.Lunch.roomsUsed} rooms` : "not planned"}
          icon={Sun}
        />
        <StatCard
          label="Today's Dinner"
          value={todayMeals.Dinner ? todayMeals.Dinner.total : "—"}
          hint={todayMeals.Dinner ? `${todayMeals.Dinner.roomsUsed} rooms` : "not planned"}
          icon={Moon}
        />
        <StatCard label="Total Employees" value={counts.total} icon={Users} />
        <StatCard
          label="Active Employees"
          value={counts.active}
          hint={`${counts.total - counts.active} inactive`}
          icon={UserCheck}
        />
      </div>

      {/* Charts */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Analytics
        </h2>
        <DashboardCharts data={chartData} />
      </section>

      {/* History */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Meal history
        </h2>
        <HistoryTable
          meals={meals}
          employees={employees}
          filters={{
            date: filter.date ?? "",
            mealType: (filter.mealType as string) ?? "All",
            category: (filter.category as string) ?? "All",
            employeeId: filter.employeeId ?? "All",
          }}
        />
      </section>
    </>
  );
}
