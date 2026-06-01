import { useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import type { Id } from "@/../convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";

import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/table-skeleton";
import {
	InvoicePreviewDialog,
	type InvoicePreviewFallback,
} from "@/components/invoice-preview-dialog";
import {
	InvoiceStatusBadge,
	type InvoiceStatus,
} from "@/components/invoice-status-badge";
import { InvoiceStatusSelect } from "@/components/invoice-status-select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ColumnHeader } from "@/components/data-table/column-header";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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

export function RecentInvoicesTable({
	invoices,
	isLoading,
	variant = "default",
}: {
	invoices?: Invoice[];
	isLoading?: boolean;
	variant?: "default" | "dashboard";
}) {
	const navigate = useNavigate();
	const { toast } = useToast();
	const updateStatus = useMutation(api.invoices.updateStatus);
	const [isUpdating, setIsUpdating] = useState(false);
	const [previewInvoiceId, setPreviewInvoiceId] =
		useState<Id<"invoices"> | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const recentInvoices = useMemo(() => {
		if (!invoices || invoices.length === 0) return [];
		return invoices
			.sort((a, b) => b.issueDate - a.issueDate)
			.slice(0, variant === "dashboard" ? 5 : undefined)
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
			}));
	}, [invoices, variant]);

	const handleStatusChange = useCallback(
		async (invoiceId: Id<"invoices">, newStatus: InvoiceStatus) => {
			setIsUpdating(true);
			try {
				await updateStatus({ invoiceId, status: newStatus });
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
				throw error;
			} finally {
				setIsUpdating(false);
			}
		},
		[updateStatus, toast],
	);

	const handleRowClick = useCallback(
		(row: InvoiceRow) => {
			navigate({ to: "/invoices/$id", params: { id: row._id } });
		},
		[navigate],
	);

	const handlePreviewOpen = useCallback((row: InvoiceRow) => {
		setPreviewInvoiceId(row._id);
		setIsPreviewOpen(true);
	}, []);

	const handlePreviewClose = useCallback((open: boolean) => {
		setIsPreviewOpen(open);
		if (!open) {
			setPreviewInvoiceId(null);
		}
	}, []);

	const columns: ColumnDef<InvoiceRow>[] = useMemo(
		() => [
			{
				accessorKey: "invoiceNumber",
				header: ({ column }) => (
					<ColumnHeader title="Invoice" column={column} />
				),
				cell: ({ row }) => (
					<span className="font-number font-medium">
						#{row.getValue<string>("invoiceNumber")}
					</span>
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
				header: ({ column }) => <ColumnHeader title="Date" column={column} />,
				cell: ({ row }) => (
					<span className="font-number">
						{format(row.original.issueDate, "MMM d, yyyy")}
					</span>
				),
			},
			{
				accessorKey: "total",
				header: ({ column }) => (
					<ColumnHeader title="Amount" column={column} />
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
						value={row.original.status}
						onValueChange={(value) =>
							handleStatusChange(row.original._id, value)
						}
						disabled={isUpdating}
					/>
				),
			},
		],
		[isUpdating, handleStatusChange],
	);

	if (isLoading || invoices === undefined) {
		return (
			<div className={variant === "dashboard" ? "" : "-mx-6 px-6 md:mx-0 md:px-0"}>
				<TableSkeleton columns={5} rows={5} />
			</div>
		);
	}

	if (recentInvoices.length === 0) {
		return <EmptyState message="No invoices yet." />;
	}

	if (variant === "dashboard") {
		return (
			<>
				<Table>
					<TableHeader>
					<TableRow className="hover:bg-transparent">
						<TableHead>
							<ColumnHeader title="Invoice" />
						</TableHead>
						<TableHead>
							<ColumnHeader title="Client" />
						</TableHead>
						<TableHead>
							<ColumnHeader title="Amount" />
						</TableHead>
						<TableHead>
							<ColumnHeader title="Status" />
						</TableHead>
						<TableHead>
							<ColumnHeader title="Date" />
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{recentInvoices.map((invoice) => (
						<TableRow
							key={invoice._id}
							className="cursor-pointer"
							onClick={() => handlePreviewOpen(invoice)}
						>
							<TableCell className="font-number font-medium py-4">
								#{invoice.invoiceNumber}
							</TableCell>
							<TableCell className="py-4">{invoice.clientName}</TableCell>
							<TableCell className="font-number py-4 font-medium">
								{new Intl.NumberFormat("en-US", {
									style: "currency",
									currency: "USD",
								}).format(invoice.total)}
							</TableCell>
							<TableCell className="py-4">
								<InvoiceStatusBadge status={invoice.status} />
							</TableCell>
							<TableCell className="font-number py-4 text-muted-foreground">
								{format(invoice.issueDate, "MMM d, yyyy")}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
				</Table>
				<InvoicePreviewDialog
					invoiceId={previewInvoiceId}
					open={isPreviewOpen}
					onOpenChange={handlePreviewClose}
					fallbackInvoices={(invoices ?? []) as InvoicePreviewFallback[]}
				/>
			</>
		);
	}

	return (
		<div className="-mx-6 px-6 md:mx-0 md:px-0">
			<DataTable
				columns={columns}
				data={recentInvoices}
				enableRowSelection={false}
				onRowClick={handleRowClick}
				pageSize={5}
			/>
		</div>
	);
}
