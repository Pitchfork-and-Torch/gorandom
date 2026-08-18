import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[transform,opacity,box-shadow,background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-cyan text-accent-fg hover:brightness-110 border border-transparent btn-glow font-semibold",
        secondary:
          "bg-bg-panel text-fg border border-border hover:border-cyan/40 hover:bg-bg-card",
        ghost: "bg-transparent text-fg-muted hover:text-fg hover:bg-bg-panel",
        magenta:
          "bg-magenta/15 text-magenta border border-magenta/40 hover:bg-magenta/25",
        danger:
          "bg-rose/10 text-rose border border-rose/30 hover:bg-rose/20",
      },
      size: {
        default: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
        lg: "h-14 px-8 text-base rounded-[var(--radius-lg)]",
        xl: "h-16 px-10 text-lg rounded-[var(--radius-xl)]",
        sm: "h-9 px-3 text-xs rounded-[var(--radius-sm)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
