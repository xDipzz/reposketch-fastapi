import type { Usage } from "@/api/client";
import { ProgressRing } from "@/components/atoms/ProgressRing";
import { Icon } from "@/components/icons/Icons";
import { cn } from "@/lib/utils";

function resetLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "resets soon";
  return `resets ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

export function UsagePill({ usage, className }: { usage: Usage | null; className?: string }) {
  if (!usage) {
    return (
      <span
        className={cn(
          "inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-[11px] font-medium text-ink-3",
          className
        )}
      >
        <Icon name="bolt" size={12} />
        Credits
      </span>
    );
  }

  const exhausted = usage.remaining <= 0;
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[11px] font-medium tabular-nums shadow-hairline",
        exhausted
          ? "border-red/30 bg-red-tint text-red"
          : "border-line bg-surface text-ink-2",
        className
      )}
      title={`${usage.remaining} of ${usage.limit} daily credits remaining`}
    >
      <Icon name="bolt" size={12} className={exhausted ? "text-red" : "text-accent-ink"} />
      {usage.remaining}
      <span className="font-sans text-[9.5px] text-ink-3">/ {usage.limit}</span>
    </span>
  );
}

export function UsageCard({ usage }: { usage: Usage | null }) {
  if (!usage) {
    return (
      <div className="mt-3 rounded-[10px] border border-line bg-surface p-2.5 shadow-hairline">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Daily credits
          </span>
          <span className="h-2 w-10 animate-pulse rounded-full bg-inset" />
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-inset">
          <div className="h-full w-1/3 rounded-full bg-line-strong" />
        </div>
      </div>
    );
  }

  const progress = usage.limit > 0 ? usage.used / usage.limit : 0;
  const exhausted = usage.remaining <= 0;

  return (
    <section className="mt-3 rounded-[10px] border border-line bg-surface p-2.5 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          Daily credits
        </span>
        <span
          className={cn(
            "font-mono text-[11px] font-semibold tabular-nums",
            exhausted ? "text-red" : "text-ink"
          )}
        >
          {usage.remaining}
          <span className="font-sans text-[9.5px] font-normal text-ink-3"> / {usage.limit}</span>
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-inset">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            exhausted ? "bg-red" : "bg-accent"
          )}
          style={{ width: `${Math.max(2, Math.min(100, progress * 100))}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2 text-[9.5px] text-ink-3">
        <span>{usage.used} used today</span>
        <span>{resetLabel(usage.reset_at)}</span>
      </div>

      <details className="group mt-2 border-t border-line pt-2">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[10px] font-medium text-ink-2 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-1">
            <Icon name="bolt" size={10} className="text-ink-3" />
            Credit costs
          </span>
          <Icon
            name="chevron-down"
            size={11}
            className="text-ink-3 transition-transform group-open:rotate-180"
          />
        </summary>
        <ul className="mt-1.5 space-y-1">
          {usage.costs.map((item) => (
            <li
              key={item.action}
              className="flex items-center justify-between gap-2 text-[10px] leading-4 text-ink-3"
            >
              <span className="truncate">{item.label}</span>
              <span className="shrink-0 font-mono text-[9.5px] tabular-nums">{item.cost}</span>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export function UsageRing({ usage }: { usage: Usage | null }) {
  if (!usage) return null;
  const progress = usage.limit > 0 ? usage.remaining / usage.limit : 0;
  return (
    <ProgressRing
      progress={progress}
      tone={usage.remaining <= 0 ? "red" : usage.remaining <= 20 ? "orange" : "accent"}
      size={24}
    >
      {usage.remaining}
    </ProgressRing>
  );
}
