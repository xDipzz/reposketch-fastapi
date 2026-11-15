"use client";

import { type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const filledShadow = "shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]";

/* Pill-shaped by default — the app's core button style. Explicit symmetric
 * padding (not a fixed height) so the top/bottom spacing is always equal. */
export const buttonVariants = cva(
  `inline-flex items-center justify-center font-medium select-none
   transition-[transform,background-color,opacity] duration-150 ease-out
   active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none`,
  {
    variants: {
      variant: {
        primary: `bg-ink text-canvas hover:opacity-90 dark:bg-ink dark:text-canvas ${filledShadow}`,
        default: `bg-ink text-canvas hover:opacity-90 dark:bg-ink dark:text-canvas ${filledShadow}`,
        secondary: "bg-surface text-ink shadow-btn hover:bg-inset aria-expanded:bg-hover",
        outline: "border border-line bg-surface text-ink shadow-btn hover:bg-inset",
        ghost: "bg-hover-2 text-ink hover:bg-line-strong",
        accent: `bg-accent text-white hover:bg-accent-ink ${filledShadow}`,
        success: `bg-green text-white hover:brightness-95 ${filledShadow}`,
        destructive: `bg-red text-white hover:brightness-95 ${filledShadow}`,
        /* transparent until hovered — for dense toolbars/action rows */
        quiet: "text-ink hover:bg-hover",
      },
      size: {
        /* compact toolbar pill — fixed height, lighter weight */
        xs: "h-7 rounded-full px-2.5 text-xs text-[12px] font-normal leading-none gap-1",
        /* canonical action pill — 27px tall, roomy sides */
        sm: "h-[27px] px-3 text-[13px] leading-none rounded-full gap-1.5",
        md: "px-4 py-[9px] text-sm leading-none rounded-full gap-2",
        default: "px-4 py-[9px] text-sm leading-none rounded-full gap-2",
        lg: "h-11 px-5 text-base leading-none rounded-full gap-2.5",
        icon: "h-8 w-8 rounded-full p-0 flex items-center justify-center",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;
export type ButtonSize = NonNullable<VariantProps<typeof buttonVariants>["size"]>;
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({
  variant,
  size,
  className,
  ...props
}: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export default Button;
