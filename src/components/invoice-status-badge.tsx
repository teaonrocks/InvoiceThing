import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue"

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
}

const STATUS_VARIANTS: Record<
  InvoiceStatus,
  "draft" | "sent" | "paid" | "overdue"
> = {
  draft: "draft",
  sent: "sent",
  paid: "paid",
  overdue: "overdue",
}

export function InvoiceStatusBadge({
  status,
  className,
}: {
  status: InvoiceStatus
  className?: string
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]} className={cn("capitalize", className)}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function invoiceStatusToVariant(
  status: string
): "draft" | "sent" | "paid" | "overdue" | "default" {
  if (status === "draft" || status === "sent" || status === "paid" || status === "overdue") {
    return status
  }
  return "default"
}
