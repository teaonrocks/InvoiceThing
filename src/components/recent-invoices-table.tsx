"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { Id } from "@/../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ArrowUpDown } from "lucide-react";

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

type InvoiceRow = {
	_id: Id<"invoices">;
	invoiceNumber: string;
	status: InvoiceStatus;
	total: number;
	issueDate: number;
	dueDate: number;
	clientId?: Id<"clients">;
	clientName: string;
	clientEmail?: string;
	clientContact?: string | null;
};

type Invoice = {
	_id: string;
	invoiceNumber: string;
	issueDate: number;
	status: "draft" | "sent" | "paid" | "overdue";
	dueDate: number;
	total: number;
	clientId?: string;
	client?: {
		name: string;
		email?: string | null;
		contactPerson?: string | null;
	} | null;
};

const STATUS_OPTIONS = [
	{ value: "draft" as InvoiceStatus, label: "Draft", color: "bg-gray-500" },
	{ value: "sent" as InvoiceStatus, label: "Sent", color: "bg-blue-500" },
	{ value: "paid" as InvoiceStatus, label: "Paid", color: "bg-green-500" },
	{ value: "overdue" as InvoiceStatus, label: "Overdue", color: "bg-red-500" },
];

const SortableHeader = ({
	title,
	column,
}: {
	title: string;
	column: {
		toggleSorting: (desc?: boolean) => void;
		getIsSorted: () => false | "asc" | "desc";
	};
}) => {
	return (
		<Button
			variant="ghost"
			onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
			className="-ml-3"
		>
			{title}
			<ArrowUpDown className="ml-2 h-4 w-4" />
		</Button>
	);
};

export function RecentInvoicesTable({ invoices }: { invoices: Invoice[] }) {
	const router = useRouter();
	const { toast } = useToast();
	const updateStatus = useMutation(api.invoices.updateStatus);
	const [isUpdating, setIsUpdating] = useState(false);

	// Get last 5 invoices sorted by issue date
	const recentInvoices = useMemo(
		() =>
			invoices
				.sort((a, b) => b.issueDate - a.issueDate)
				.slice(0, 5)
				.map((invoice) => ({
					_id: invoice._id as Id<"invoices">,
					invoiceNumber: invoice.invoiceNumber,
					status: invoice.status as InvoiceStatus,
					total: invoice.total,
					issueDate: invoice.issueDate,
					dueDate: invoice.dueDate,
					clientId: invoice.clientId as Id<"clients"> | undefined,
					clientName: invoice.client?.name ?? "Unknown client",
					clientEmail: invoice.client?.email ?? undefined,
					clientContact: invoice.client?.contactPerson ?? undefined,
				})),
		[invoices]
	);

	const handleStatusChange = useCallback(
		async (invoiceId: Id<"invoices">, newStatus: InvoiceStatus) => {
			setIsUpdating(true);
			try {
				await updateStatus({
					invoiceId,
					status: newStatus,
				});
				toast({
					title: "Status updated",
					description: `Invoice status changed to ${newStatus}.`,
				});
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to update",
					description:
						"We couldn't update the invoice status. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsUpdating(false);
			}
		},
		[updateStatus, toast]
	);

	const columns: ColumnDef<InvoiceRow>[] = useMemo(
		() => [
			{
				accessorKey: "invoiceNumber",
				header: ({ column }) => (
					<SortableHeader title="Invoice" column={column} />
				),
				cell: ({ row }) => (
					<span className="font-medium">
						#{row.getValue<string>("invoiceNumber")}
					</span>
				),
			},
			{
				accessorKey: "clientName",
				header: ({ column }) => (
					<SortableHeader title="Client" column={column} />
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
				header: ({ column }) => <SortableHeader title="Date" column={column} />,
				cell: ({ row }) => (
					<span>{format(row.original.issueDate, "MMM d, yyyy")}</span>
				),
			},
			{
				accessorKey: "total",
				header: ({ column }) => (
					<SortableHeader title="Amount" column={column} />
				),
				cell: ({ row }) => {
					const amount = Number(row.getValue("total"));
					const formatted = new Intl.NumberFormat("en-US", {
						style: "currency",
						currency: "USD",
					}).format(amount);
					return <span className="font-medium">{formatted}</span>;
				},
			},
			{
				accessorKey: "status",
				header: "Status",
				cell: ({ row }) => (
					<div className="flex items-center gap-2">
						<Select
							defaultValue={row.original.status}
							onValueChange={(value) =>
								handleStatusChange(row.original._id, value as InvoiceStatus)
							}
							disabled={isUpdating}
						>
							<SelectTrigger className="h-8 w-[140px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{STATUS_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex items-center gap-2">
											<span
												className={cn("h-2.5 w-2.5 rounded-full", option.color)}
											/>
											{option.label}
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				),
			},
		],
		[isUpdating, handleStatusChange]
	);

	if (recentInvoices.length === 0) {
		return (
			<div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
				No invoices yet.
			</div>
		);
	}

	const handleRowClick = (row: InvoiceRow) => {
		router.push(`/invoices/${row._id}`);
	};

	return (
		<div className="-mx-6 px-6 md:mx-0 md:px-0">
			<DataTable
				columns={columns}
				data={recentInvoices}
				enableRowSelection={false}
				onRowClick={handleRowClick}
			/>
		</div>
	);
}
