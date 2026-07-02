import Link from "next/link";
import { Lock, UtensilsCrossed } from "lucide-react";

import { getRecentMealDetails, type MealDetail } from "@/server/queries";
import { formatDate } from "@/lib/date";
import { DINER_CATEGORIES, ROOM_CAPACITY, type DinerCategory } from "@/lib/constants";
import { CategoryBadge } from "@/components/category-badge";
import { AutoRefresh } from "@/components/auto-refresh";
import { LiveClock } from "@/components/live-clock";

export const dynamic = "force-dynamic";

function RoomCard({ room }: { room: MealDetail["rooms"][number] }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center justify-between border-b px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-foreground text-base font-semibold text-background">
            {room.room}
          </span>
          <span className="text-lg font-semibold">Dining Room {room.room}</span>
        </div>
        <span className="font-mono text-lg font-semibold tabular-nums text-muted-foreground">
          {room.diners.length} / {ROOM_CAPACITY}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b px-5 py-3">
        {DINER_CATEGORIES.map((cat) =>
          room.counts[cat] > 0 ? (
            <span key={cat} className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CategoryBadge category={cat} className="px-2 py-0.5" />
              <span className="font-mono font-semibold tabular-nums">{room.counts[cat]}</span>
            </span>
          ) : null,
        )}
      </div>

      <ul className="grid grid-cols-1 gap-x-6 gap-y-1 px-5 py-4 sm:grid-cols-2">
        {room.diners.map((d) => (
          <li key={d.id} className="flex items-baseline justify-between gap-2 py-1">
            <span className="truncate text-base font-medium">{d.name}</span>
            <CategoryBadge
              category={d.category as DinerCategory}
              className="shrink-0 px-1.5 py-0 text-[10px]"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MealBoard({ meal }: { meal: MealDetail }) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b pb-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight">{meal.mealType}</h2>
          <p className="text-sm text-muted-foreground">{formatDate(meal.date)}</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              People
            </p>
            <p className="font-mono text-4xl font-semibold tabular-nums">{meal.total}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rooms
            </p>
            <p className="font-mono text-4xl font-semibold tabular-nums">{meal.rooms.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {meal.rooms.map((room) => (
          <RoomCard key={room.room} room={room} />
        ))}
      </div>
    </section>
  );
}

export default async function KitchenPage() {
  const meals = await getRecentMealDetails(2);

  return (
    <div className="min-h-screen">
      <AutoRefresh />

      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/85 px-6 py-4 backdrop-blur md:px-10">
        <div className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <UtensilsCrossed className="size-4" />
          </span>
          <span className="text-lg">Eat Ticker</span>
          <span className="ml-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            Kitchen
          </span>
        </div>
        <div className="flex items-center gap-4">
          <LiveClock />
          <Link
            href="/db"
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Lock className="size-3.5" /> Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-10 px-6 py-8 md:px-10 md:py-10">
        {meals.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
            <UtensilsCrossed className="size-8 text-muted-foreground" />
            <p className="text-lg font-medium">No meals planned yet</p>
            <p className="text-sm text-muted-foreground">
              Saved meal plans will appear here automatically.
            </p>
          </div>
        ) : (
          meals.map((meal) => <MealBoard key={meal.id} meal={meal} />)
        )}
      </main>
    </div>
  );
}
