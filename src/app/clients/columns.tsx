"use client";

import Link from "next/link";
import { format } from "date-fns";
import type { ColumnDef, HeaderContext } from "@tanstack/react-table";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Loader2, MoreHorizontal, Trash2 } from "lucide-react";

export interface ClientRow {
	_id: Id<"clients">;
	name: string;
	email?: string;
	address?: string | null;
	contactPerson?: string | null;
	createdAt: number;
	invoiceCount?: number;
}

const SortableHeader = ({
	title,
	column,
}: {
	title: string;
	column: HeaderContext<ClientRow, unknown>["column"];
}) => (
	<Button
		variant="ghost"
		onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
		className="-ml-3"
	>
		{title}
		<ArrowUpDown className="ml-2 h-4 w-4" />
	</Button>
);

interface ClientColumnMeta {
	onDeleteClient?: (client: ClientRow) => void;
	isDeleting?: boolean;
}

export const clientColumns: ColumnDef<ClientRow>[] = [
	{
		id: "select",
		enableSorting: false,
		enableHiding: false,
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label={`Select client ${row.original.name}`}
			/>
		),
	},
	{
		accessorKey: "name",
		header: ({ column }) => <SortableHeader title="Client" column={column} />,
		cell: ({ row }) => (
			<div className="flex flex-col">
				<span className="font-medium">{row.original.name}</span>
				{row.original.contactPerson ? (
					<span className="text-xs text-muted-foreground">
						Contact: {row.original.contactPerson}
					</span>
				) : null}
			</div>
		),
	},
	{
		accessorKey: "email",
		header: ({ column }) => <SortableHeader title="Email" column={column} />,
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{row.original.email || "Not provided"}
			</span>
		),
	},
	{
		accessorKey: "address",
		header: "Address",
		cell: ({ row }) => (
			<span className="max-w-[260px] truncate text-sm text-muted-foreground">
				{row.original.address || "—"}
			</span>
		),
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => <SortableHeader title="Added" column={column} />,
		cell: ({ row }) => (
			<span className="text-sm">
				{format(row.original.createdAt, "MMM d, yyyy")}
			</span>
		),
	},
	{
		id: "actions",
		enableHiding: false,
		header: () => null,
		cell: ({ row, table }) => {
			const meta = table.options.meta as ClientColumnMeta | undefined;
			const isDeleting = meta?.isDeleting ?? false;
			const handleDelete = () => meta?.onDeleteClient?.(row.original);

			return (
				<div className="flex justify-end pr-1">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 p-0"
								data-no-row-click
							>
								<span className="sr-only">Open menu</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-44">
							<DropdownMenuItem asChild data-no-row-click>
								<Link href={`/clients/${row.original._id}`}>View details</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild data-no-row-click>
								<Link href={`/clients/${row.original._id}?mode=edit`}>
									Edit client
								</Link>
							</DropdownMenuItem>
							<AlertDialog>
								<AlertDialogTrigger asChild>
									<DropdownMenuItem
										onSelect={(event) => event.preventDefault()}
										className="flex items-center gap-2 text-destructive focus:text-destructive"
										data-no-row-click
									>
										<Trash2 className="h-4 w-4" /> Delete
									</DropdownMenuItem>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>
											Delete client {row.original.name}?
										</AlertDialogTitle>
										<AlertDialogDescription>
											This action is permanent and will remove the client and
											any related records.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={isDeleting}>
											Cancel
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDelete}
											disabled={isDeleting}
											className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
										>
											{isDeleting ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Trash2 className="mr-2 h-4 w-4" />
											)}
											Delete
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			);
		},
	},
];
