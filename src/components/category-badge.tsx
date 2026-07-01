import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DinerCategory } from "@/lib/constants";

// Neutral, subtle hierarchy — no bright colors. Boss reads strongest, Guest is
// a dashed outline to signal "not a permanent employee".
const STYLES: Record<DinerCategory, string> = {
  Boss: "bg-foreground text-background border-transparent",
  Manager: "bg-secondary text-secondary-foreground border-transparent",
  Staff: "bg-muted text-muted-foreground border-transparent",
  Guest: "bg-transparent text-muted-foreground border-dashed border-border",
};

export function CategoryBadge({
  category,
  className,
}: {
  category: DinerCategory;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-medium", STYLES[category], className)}>
      {category}
    </Badge>
  );
}
