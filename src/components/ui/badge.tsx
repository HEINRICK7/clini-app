import { cn } from "@/lib/utils";

type BadgeProps = Readonly<React.ComponentProps<"span">>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "mb-3 inline-flex min-h-7 items-center rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-primary-strong ring-1 ring-inset ring-cyan-200",
        className,
      )}
      {...props}
    />
  );
}
