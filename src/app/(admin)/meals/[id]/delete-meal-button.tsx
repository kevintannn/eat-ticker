"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteMeal } from "@/server/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";

export function DeleteMealButton({ id }: { id: string }) {
  const router = useRouter();

  async function handleDelete() {
    const res = await deleteMeal(id);
    if (res.ok) {
      toast.success("Meal deleted");
      router.push("/db");
    } else {
      toast.error(res.error ?? "Failed to delete");
    }
  }

  return (
    <ConfirmDialog
      title="Delete meal record?"
      description="This permanently removes this meal and its dining room assignments."
      confirmLabel="Delete"
      destructive
      onConfirm={handleDelete}
      trigger={
        <Button variant="outline" size="sm">
          <Trash2 className="size-4" /> Delete
        </Button>
      }
    />
  );
}
