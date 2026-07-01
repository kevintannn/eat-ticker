import { Users } from "lucide-react";

import { CategoryBadge } from "@/components/category-badge";
import { Card } from "@/components/ui/card";
import { ROOM_CAPACITY, DINER_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { DiningRoom } from "@/lib/types";

export function DiningRoomCard({ room }: { room: DiningRoom }) {
  const count = room.diners.length;
  const isFull = count === ROOM_CAPACITY;

  return (
    <Card
      className={cn(
        "gap-0 overflow-hidden p-0 transition-all duration-300",
        isFull && "ring-1 ring-emerald-500/40",
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-secondary text-xs font-semibold">
            {room.room}
          </span>
          <span className="text-sm font-semibold">Dining Room {room.room}</span>
        </div>
        <span
          className={cn(
            "font-mono text-sm font-semibold tabular-nums transition-colors",
            isFull ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {count} / {ROOM_CAPACITY}
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
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {d.isGuest ? "guest" : `#${d.priority}`}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
