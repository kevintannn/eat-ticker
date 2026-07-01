"use client";

import { useState } from "react";
import { Plus, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Guest {
  id: string;
  name: string;
}

interface GuestManagerProps {
  guests: Guest[];
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
}

export function GuestManager({ guests, onAdd, onRemove }: GuestManagerProps) {
  const [name, setName] = useState("");

  function add() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setName("");
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Guest name…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!name.trim()}>
          <Plus className="size-4" /> Add
        </Button>
      </div>

      {guests.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <UserPlus className="size-3.5" />
          Guests are seated first, in Dining Room 1.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {guests.map((g) => (
            <span
              key={g.id}
              className="flex items-center gap-1.5 rounded-full border border-dashed bg-background py-1 pl-3 pr-1.5 text-sm"
            >
              {g.name}
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                aria-label={`Remove ${g.name}`}
                className="flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
