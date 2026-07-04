import { cn } from "@/lib/utils";

type Status = string;

const LABELS: Record<string, string> = {
  received: "Received",
  parsed: "Needs review",
  reviewed: "Reviewed",
  invoiced: "Invoiced",
  paid: "Paid",
  failed: "Failed",
};

const STYLES: Record<string, string> = {
  received: "bg-muted text-muted-foreground border border-border",
  parsed: "bg-accent-red/10 text-accent-red border border-accent-red/30",
  reviewed: "bg-transparent text-foreground border border-foreground/40",
  invoiced: "bg-foreground text-background border border-foreground",
  paid: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  failed: "bg-destructive/10 text-destructive border border-destructive/30",
};

export function StatusChip({ status }: { status: Status }) {
  const label = LABELS[status] ?? status;
  const style = STYLES[status] ?? STYLES.received;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
        style,
      )}
    >
      {label}
    </span>
  );
}
