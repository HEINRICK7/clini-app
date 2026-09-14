import { cn } from "@/lib/utils";

type CardProps = Readonly<React.ComponentProps<"section">>;

export function Card({ className, ...props }: CardProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface",
        className,
      )}
      {...props}
    />
  );
}
