import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { ColumnDef } from "@tanstack/react-table";

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
import { InvoiceStatusSelect } from "@/components/invoice-status-select";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColumnHeader } from "@/components/data-table/column-header";
import { Loader2, MoreHorizontal, Trash2 } from "lucide-react";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface InvoiceRow {
	_id: Id<"invoices">;
	invoiceNumber: string;
	status: InvoiceStatus;
	total: number;
	issueDate: number;
	dueDate: number;
	clientId: Id<"clients">;
	clientName: string;
	clientEmail?: string;
	clientContact?: string | null;
}

interface InvoiceColumnMeta {
	onDeleteInvoice?: (invoice: InvoiceRow) => void;
	onDownloadPdf?: (invoice: InvoiceRow) => void;
	isDeleting?: boolean;
	downloadingInvoiceId?: Id<"invoices"> | null;
}

interface InvoiceColumnOptions {
	onStatusChange: (invoiceId: Id<"invoices">, status: InvoiceStatus) => void;
	disableStatusChange?: boolean;
}

export const useInvoiceColumns = ({
	onStatusChange,
	disableStatusChange,
}: InvoiceColumnOptions): ColumnDef<InvoiceRow>[] => {
	return useMemo(() => {
		return [
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
						onCheckedChange={(value) =>
							table.toggleAllPageRowsSelected(!!value)
						}
						aria-label="Select all"
					/>
				),
				cell: ({ row }) => (
					<Checkbox
						checked={row.getIsSelected()}
						onCheckedChange={(value) => row.toggleSelected(!!value)}
						aria-label={`Select invoice ${row.original.invoiceNumber}`}
					/>
				),
			},
			{
				accessorKey: "invoiceNumber",
				header: ({ column }) => (
					<ColumnHeader title="Invoice" column={column} />
				),
				cell: ({ row }) => (
					<div className="font-number font-medium">
						#{row.getValue<string>("invoiceNumber")}
					</div>
				),
			},
			{
				accessorKey: "clientName",
				header: ({ column }) => (
					<ColumnHeader title="Client" column={column} />
				),
				cell: ({ row }) => (
					<div className="flex flex-col">
						<span className="font-medium">{row.original.clientName}</span>
						{row.original.clientEmail ? (
							<span className="text-xs text-muted-foreground">
								{row.original.clientEmail}
							</span>
						) : null}
					</div>
				),
			},
			{
				accessorKey: "issueDate",
				header: ({ column }) => (
					<ColumnHeader title="Issued" column={column} />
				),
				cell: ({ row }) => (
					<span className="font-number">
						{format(row.original.issueDate, "MMM d, yyyy")}
					</span>
				),
			},
			{
				accessorKey: "dueDate",
				header: ({ column }) => <ColumnHeader title="Due" column={column} />,
				cell: ({ row }) => (
					<span className="font-number">
						{format(row.original.dueDate, "MMM d, yyyy")}
					</span>
				),
			},
			{
				accessorKey: "total",
				header: ({ column }) => (
					<ColumnHeader title="Total" column={column} />
				),
				cell: ({ row }) => {
					const amount = Number(row.getValue("total"));
					const formatted = new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
					}).format(amount);
					return (
						<span className="font-number font-medium">{formatted}</span>
					);
				},
			},
			{
				accessorKey: "status",
				header: () => <ColumnHeader title="Status" />,
				cell: ({ row }) => (
					<InvoiceStatusSelect
						defaultValue={row.original.status}
						onValueChange={(value) =>
							onStatusChange(row.original._id, value)
						}
						disabled={disableStatusChange}
					/>
				),
			},
			{
				id: "actions",
				enableHiding: false,
				header: () => null,
				cell: ({ row, table }) => {
					const meta = table.options.meta as InvoiceColumnMeta | undefined;
					const isDeleting = meta?.isDeleting ?? false;
					const isDownloadingPdf =
						meta?.downloadingInvoiceId === row.original._id;
					const handleDelete = () => meta?.onDeleteInvoice?.(row.original);
					const handleDownloadPdf = () =>
						meta?.onDownloadPdf?.(row.original);

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
										<Link
											to="/invoices/$id"
											params={{ id: row.original._id }}
										>
											View details
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild data-no-row-click>
										<Link
											to="/invoices/$id/edit"
											params={{ id: row.original._id }}
										>
											Edit invoice
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={(event) => {
											event.preventDefault();
											handleDownloadPdf();
										}}
										disabled={isDownloadingPdf}
										data-no-row-click
									>
										{isDownloadingPdf && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										)}
										Download PDF
									</DropdownMenuItem>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<DropdownMenuItem
												onSelect={(event) => event.preventDefault()}
												className="text-destructive focus:text-destructive"
												data-no-row-click
											>
												Delete
											</DropdownMenuItem>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Delete invoice {row.original.invoiceNumber}?
												</AlertDialogTitle>
												<AlertDialogDescription>
													This action is permanent and will remove the invoice
													and any related records.
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
	}, [disableStatusChange, onStatusChange]);
};
