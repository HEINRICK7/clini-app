import { cn } from "@/lib/utils";

type ButtonProps = Readonly<React.ComponentProps<"button">> & {
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "ghost";
};

export function Button({
  className,
  size = "md",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-primary disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "min-h-11 px-3 text-xs sm:text-sm" : "min-h-12",
        variant === "primary" && "bg-primary text-primary-foreground shadow-sm hover:bg-primary-strong",
        variant === "outline" && "border border-border bg-surface text-foreground hover:bg-surface-muted",
        variant === "ghost" && "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
        className,
      )}
      type="button"
      {...props}
    />
  );
}
