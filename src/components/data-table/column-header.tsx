import type { HeaderContext } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

/** Matches dashboard table header label styling */
export const columnHeaderLabelClassName =
	"text-muted-foreground text-xs font-medium tracking-wide uppercase";

type ColumnHeaderProps<TData, TValue> = {
	title: string;
	column?: HeaderContext<TData, TValue>["column"];
	className?: string;
};

export function ColumnHeader<TData, TValue>({
	title,
	column,
	className,
}: ColumnHeaderProps<TData, TValue>) {
	const label = title.toUpperCase();

	if (!column) {
		return (
			<span className={cn(columnHeaderLabelClassName, className)}>{label}</span>
		);
	}

	return (
		<button
			type="button"
			className={cn(
				columnHeaderLabelClassName,
				"inline-flex items-center gap-1.5 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
				className,
			)}
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
		>
			{label}
			<ArrowUpDown
				className={cn(
					"h-3.5 w-3.5 shrink-0 opacity-40",
					column.getIsSorted() && "opacity-70",
				)}
			/>
		</button>
	);
}
