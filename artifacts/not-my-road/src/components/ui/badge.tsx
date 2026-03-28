import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "pending" | "in_progress" | "resolved" | "outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-primary/10 text-primary border border-primary/20",
    pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    in_progress: "bg-secondary/10 text-secondary border border-secondary/20 shadow-[0_0_10px_rgba(0,212,255,0.2)]",
    resolved: "bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(0,255,135,0.2)]",
    outline: "text-foreground border border-border",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
