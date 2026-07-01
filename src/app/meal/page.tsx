import { getActiveEmployees } from "@/server/queries";
import { loadMealSelection } from "@/server/actions";
import { todayKey } from "@/lib/date";
import { PageHeader } from "@/components/page-header";
import { MealPlanner } from "./meal-planner";

export const dynamic = "force-dynamic";

export default async function MealPage() {
  const date = todayKey();
  const [employees, initialSelection] = await Promise.all([
    getActiveEmployees(),
    loadMealSelection(date, "Lunch"),
  ]);

  return (
    <>
      <PageHeader
        title="Today's Meal"
        description="Pick who's eating — dining rooms fill automatically by priority."
      />
      {employees.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-sm text-muted-foreground">
            No active employees yet. Add employees first to plan a meal.
          </p>
        </div>
      ) : (
        <MealPlanner
          employees={employees}
          defaultDate={date}
          initialSelection={initialSelection}
        />
      )}
    </>
  );
}
