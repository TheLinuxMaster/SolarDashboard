import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full text-sm font-medium transition-[background,border-color,color,transform,box-shadow]",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-solar-bright text-[#1b1207] shadow-[0_12px_36px_-14px_rgba(255,198,109,0.65)] hover:bg-[#ffd48c] active:translate-y-px",
        glass:
          "glass-flat text-ink hover:border-line-strong hover:bg-white/[0.07] active:translate-y-px",
        ghost:
          "text-ink-2 hover:bg-white/[0.06] hover:text-ink active:translate-y-px",
        danger:
          "border border-bad/30 bg-bad/10 text-bad hover:border-bad/45 hover:bg-bad/15",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        default: "h-10 px-4",
        lg: "h-11 px-5 text-[0.95rem]",
        icon: "size-10",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "glass",
      size: "default",
    },
  },
);

export function Button({
  className,
  variant = "glass",
  size = "default",
  type = "button",
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type={type}
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
