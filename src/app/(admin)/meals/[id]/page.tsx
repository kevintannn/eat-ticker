import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";

import { getMealDetail } from "@/server/queries";
import { formatDate, formatDateTime } from "@/lib/date";
import { DINER_CATEGORIES, ROOM_CAPACITY, type DinerCategory } from "@/lib/constants";

import { CategoryBadge } from "@/components/category-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeleteMealButton } from "./delete-meal-button";

export const dynamic = "force-dynamic";

export default async function MealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meal = await getMealDetail(id);
  if (!meal) notFound();

  return (
    <>
      <Link
        href="/db"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{formatDate(meal.date)}</h1>
            <Badge variant="secondary">{meal.mealType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {meal.total} {meal.total === 1 ? "person" : "people"} · {meal.rooms.length}{" "}
            {meal.rooms.length === 1 ? "room" : "rooms"} · saved {formatDateTime(meal.createdAt)}
          </p>
        </div>
        <DeleteMealButton id={meal.id} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {meal.rooms.map((room) => (
          <Card key={room.room} className="gap-0 overflow-hidden p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
                  {room.room}
                </span>
                <span className="text-sm font-semibold">Dining Room {room.room}</span>
              </div>
              <span className="font-mono text-sm text-muted-foreground tabular-nums">
                {room.diners.length} / {ROOM_CAPACITY}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 border-b px-4 py-2.5">
              {DINER_CATEGORIES.map((cat) =>
                room.counts[cat] > 0 ? (
                  <span key={cat} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CategoryBadge category={cat} className="px-1.5 py-0 text-[10px]" />
                    {room.counts[cat]}
                  </span>
                ) : null,
              )}
            </div>

            <ul className="divide-y">
              {room.diners.map((d) => (
                <li key={d.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="size-3.5 text-muted-foreground" />
                    {d.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <CategoryBadge
                      category={d.category as DinerCategory}
                      className="px-1.5 py-0 text-[10px]"
                    />
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {d.isGuest ? "guest" : `#${d.priority}`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
