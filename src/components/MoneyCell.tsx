import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function MoneyCell({
  amount,
  className,
  muted,
}: {
  amount: number | null | undefined;
  className?: string;
  muted?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular-nums tracking-tight",
        muted && "text-muted-foreground",
        className,
      )}
    >
      {formatCurrency(amount)}
    </span>
  );
}
