import { cn } from "@/lib/utils"

export function EmptyState({
  message = "No results.",
  className,
}: {
  message?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex h-24 items-center justify-center text-sm text-muted-foreground",
        className
      )}
    >
      {message}
    </div>
  )
}
