import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "group/card bg-card text-card-foreground flex flex-col",
  {
    variants: {
      variant: {
        default: "gap-6 rounded-sm border py-6 shadow-sm",
        panel: "gap-0 rounded-none border border-border shadow-none p-0",
        stat: "gap-0 rounded-none border border-border shadow-none p-0",
        brand: "gap-0 rounded-none border-2 border-border-strong shadow-none p-0",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Card({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      data-variant={variant ?? "default"}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        "group-data-[variant=panel]/card:gap-1 group-data-[variant=panel]/card:px-6 group-data-[variant=panel]/card:pt-5 group-data-[variant=panel]/card:pb-0",
        "group-data-[variant=stat]/card:px-6 group-data-[variant=stat]/card:pt-5 group-data-[variant=stat]/card:pb-0",
        "group-data-[variant=brand]/card:px-6 group-data-[variant=brand]/card:pt-5 group-data-[variant=brand]/card:pb-0",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        "px-6",
        "group-data-[variant=panel]/card:px-6 group-data-[variant=panel]/card:pt-4 group-data-[variant=panel]/card:pb-6",
        "group-data-[variant=stat]/card:px-6 group-data-[variant=stat]/card:pt-2 group-data-[variant=stat]/card:pb-5",
        "group-data-[variant=brand]/card:px-6 group-data-[variant=brand]/card:py-6",
        className
      )}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}
