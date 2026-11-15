import React from "react";

export type Tone = "neutral" | "green" | "orange" | "red" | "accent";

const TONES: Record<Tone, { cls: string; ring: string }> = {
  neutral: { cls: "bg-field text-ink-2", ring: "var(--shadow-hairline)" },
  green: { cls: "bg-green-tint text-green", ring: "0 0 0 1px color-mix(in oklch, var(--green) 28%, transparent)" },
  orange: { cls: "bg-orange-tint text-orange", ring: "0 0 0 1px color-mix(in oklch, var(--orange) 28%, transparent)" },
  red: { cls: "bg-red-tint text-red", ring: "0 0 0 1px color-mix(in oklch, var(--red) 28%, transparent)" },
  accent: { cls: "bg-accent-tint text-accent-ink", ring: "0 0 0 1px color-mix(in oklch, var(--accent) 28%, transparent)" },
};

export interface ValuePillProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function ValuePill({
  children,
  tone = "neutral",
  className = "",
}: ValuePillProps) {
  const t = TONES[tone] ?? TONES.neutral;
  return (
    <span
      className={`mx-0.5 inline-flex items-center rounded-full px-1.5 py-0
        align-middle text-[12px] font-medium ${t.cls} ${className}`}
      style={{ boxShadow: t.ring }}
    >
      {children}
    </span>
  );
}

export default ValuePill;
