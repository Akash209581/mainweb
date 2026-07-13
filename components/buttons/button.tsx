import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "focus-ring inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "bg-primary text-white shadow-soft hover:-translate-y-0.5 hover:bg-primary/90",
        secondary: "bg-secondary text-white shadow-soft hover:-translate-y-0.5 hover:bg-secondary/90",
        outline:
          "border border-border/60 bg-surface/30 text-foreground hover:-translate-y-0.5 hover:bg-hover/10",
        ghost: "text-muted hover:bg-hover/10 hover:text-foreground",
        danger: "bg-danger text-white shadow-soft hover:-translate-y-0.5 hover:bg-danger/90",
        success: "bg-success text-white shadow-soft hover:-translate-y-0.5 hover:bg-success/90"
      },
      size: {
        sm: "h-9 rounded-md px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "size-11 px-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  asChild = false,
  className,
  children,
  variant,
  size,
  isLoading,
  disabled,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  if (asChild) {
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} {...props}>
        {children}
      </Comp>
    );
  }

  return (
    <Comp className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || isLoading} {...props}>
      {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </Comp>
  );
}
