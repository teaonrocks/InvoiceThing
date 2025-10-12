"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { pdf } from "@react-pdf/renderer";
import { Download, FileText, Loader2, Trash2 } from "lucide-react";

import { Navigation } from "@/components/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { InvoicePDF } from "@/components/invoice-pdf";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
	InvoiceStatus,
	InvoiceStatusOption,
	InvoiceRow,
	useInvoiceColumns,
} from "./columns";

const STATUS_OPTIONS: InvoiceStatusOption[] = [
	{ value: "draft", label: "Draft", color: "bg-gray-500" },
	{ value: "sent", label: "Sent", color: "bg-blue-500" },
	{ value: "paid", label: "Paid", color: "bg-green-500" },
	{ value: "overdue", label: "Overdue", color: "bg-red-500" },
];

type InvoicePreview = {
	_id: Id<"invoices">;
	invoiceNumber: string;
	status: InvoiceStatus;
	issueDate: number;
	dueDate: number;
	total: number;
	notes?: string | null;
	clientName?: string;
	clientEmail?: string | null;
	client?: {
		name: string;
		email?: string | null;
		contactPerson?: string | null;
	} | null;
	lineItems?: {
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}[];
};

export default function InvoicesPage() {
	const { user } = useUser();
	const { toast } = useToast();
	const convex = useConvex();
	const convexUser = useQuery(
		api.users.getCurrentUser,
		user?.id ? { clerkId: user.id } : "skip"
	);
	const invoices = useQuery(
		api.invoices.getByUser,
		convexUser?._id ? { userId: convexUser._id } : "skip"
	);

	const updateStatus = useMutation(api.invoices.updateStatus);
	const updateStatusBulk = useMutation(api.invoices.updateStatusBulk);
	const deleteInvoices = useMutation(api.invoices.removeMany);

	const [selectedInvoices, setSelectedInvoices] = useState<InvoiceRow[]>([]);
	const [isBulkUpdating, setIsBulkUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isStatusUpdating, setIsStatusUpdating] = useState(false);
	const [previewInvoiceId, setPreviewInvoiceId] = useState<Id<"invoices"> | null>(
		null
	);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const invoiceList = useMemo(() => invoices ?? [], [invoices]);

	const previewInvoice = useQuery(
		api.invoices.get,
		previewInvoiceId ? { invoiceId: previewInvoiceId } : "skip"
	);

	const fallbackPreviewInvoice = useMemo(() => {
		if (!previewInvoiceId) return null;
		return invoiceList.find((invoice) => invoice._id === previewInvoiceId) ?? null;
	}, [invoiceList, previewInvoiceId]);

	const invoiceForPreview = (previewInvoice ?? fallbackPreviewInvoice) as
		| InvoicePreview
		| null;

	const previewStatusOption = useMemo(() => {
		if (!invoiceForPreview) return undefined;
		return STATUS_OPTIONS.find((option) => option.value === invoiceForPreview.status);
	}, [invoiceForPreview]);

	const tableData: InvoiceRow[] = useMemo(
		() =>
			invoiceList.map((invoice) => ({
				_id: invoice._id as Id<"invoices">,
				invoiceNumber: invoice.invoiceNumber,
				status: invoice.status as InvoiceStatus,
				total: invoice.total,
				issueDate: invoice.issueDate,
				dueDate: invoice.dueDate,
				clientId: invoice.clientId as Id<"clients">,
				clientName: invoice.client?.name ?? "Unknown client",
				clientEmail: invoice.client?.email ?? undefined,
				clientContact: invoice.client?.contactPerson ?? undefined,
			})),
		[invoiceList]
	);

	const selectedIds = useMemo(
		() => selectedInvoices.map((invoice) => invoice._id),
		[selectedInvoices]
	);
	const selectedCount = selectedIds.length;
	const isBusy = isBulkUpdating || isDeleting || isDownloading || isStatusUpdating;

	const handlePreviewClose = useCallback(() => {
		setIsPreviewOpen(false);
		setPreviewInvoiceId(null);
	}, []);

	const handleRowPreview = useCallback((invoice: InvoiceRow) => {
		setPreviewInvoiceId(invoice._id);
		setIsPreviewOpen(true);
	}, []);

	const handleDeleteInvoice = useCallback(
		async (invoice: InvoiceRow) => {
			setIsDeleting(true);
			try {
				await deleteInvoices({
					invoiceIds: [invoice._id],
				});
				setSelectedInvoices((current) =>
					current.filter((item) => item._id !== invoice._id)
				);
				toast({
					title: "Invoice deleted",
					description: `Invoice ${invoice.invoiceNumber} has been removed.`,
				});
				if (previewInvoiceId === invoice._id) {
					handlePreviewClose();
				}
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to delete",
					description: "An error occurred while deleting the invoice.",
					variant: "destructive",
				});
			} finally {
				setIsDeleting(false);
			}
		},
		[deleteInvoices, handlePreviewClose, previewInvoiceId, toast]
	);

	const handleStatusChange = useCallback(
		async (invoiceId: Id<"invoices">, newStatus: InvoiceStatus) => {
			setIsStatusUpdating(true);
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
					description: "We couldn't update the invoice status. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsStatusUpdating(false);
			}
		},
		[toast, updateStatus]
	);

	const handleBulkStatusChange = useCallback(
		async (status: InvoiceStatus) => {
			if (!selectedIds.length) return;
			setIsBulkUpdating(true);
			try {
				await updateStatusBulk({
					invoiceIds: selectedIds,
					status,
				});
				toast({
					title: "Status updated",
					description: `Updated ${selectedIds.length} invoice(s).`,
				});
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to update",
					description: "An error occurred while updating invoice statuses.",
					variant: "destructive",
				});
			} finally {
				setIsBulkUpdating(false);
			}
		},
		[selectedIds, toast, updateStatusBulk]
	);

	const handleBulkDelete = useCallback(async () => {
		if (!selectedIds.length) return;
		setIsDeleting(true);
		try {
			await deleteInvoices({
				invoiceIds: selectedIds,
			});
			setSelectedInvoices([]);
			if (previewInvoiceId && selectedIds.includes(previewInvoiceId)) {
				handlePreviewClose();
			}
			toast({
				title: "Invoices deleted",
				description: "Selected invoices have been removed.",
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "Unable to delete",
				description: "An error occurred while deleting invoices.",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
		}
	}, [deleteInvoices, handlePreviewClose, previewInvoiceId, selectedIds, toast]);

	const handleBulkDownload = useCallback(async () => {
		if (!selectedIds.length) return;
		setIsDownloading(true);
		try {
			for (const invoiceId of selectedIds) {
				const invoice = await convex.query(api.invoices.get, {
					invoiceId,
				});
				if (!invoice) continue;

				const claimImageUrls = await Promise.all(
					(invoice.claims ?? []).map(async (claim) => {
						if (!claim.imageStorageId) return undefined;
						const url = await convex.query(api.files.getFileUrl, {
							storageId: claim.imageStorageId,
						});
						return url ?? undefined;
					})
				);

				const clientInfo = invoice.client
					? {
						name: invoice.client.name,
						email: invoice.client.email ?? "",
						address: invoice.client.address,
						contactPerson: invoice.client.contactPerson,
					}
					: {
						name: "Unknown client",
						email: "",
						address: undefined,
						contactPerson: undefined,
					};

				const pdfData = {
					invoiceNumber: invoice.invoiceNumber,
					issueDate: format(new Date(invoice.issueDate), "MMMM d, yyyy"),
					dueDate: format(new Date(invoice.dueDate), "MMMM d, yyyy"),
					client: clientInfo,
					lineItems: invoice.lineItems.map((item) => ({
						description: item.description,
						quantity: item.quantity,
						unitPrice: item.unitPrice,
						total: item.total,
					})),
					claims: invoice.claims?.map((claim, index) => ({
						description: claim.description,
						amount: claim.amount,
						date: format(new Date(claim.date), "MMM d, yyyy"),
						imageUrl: claimImageUrls[index] ?? undefined,
					})),
					subtotal: invoice.subtotal,
					tax: invoice.tax,
					total: invoice.total,
					notes: invoice.notes,
				};

				const blob = await pdf(<InvoicePDF invoice={pdfData} />).toBlob();
				const url = URL.createObjectURL(blob);
				const link = document.createElement("a");
				link.href = url;
				link.download = `invoice-${invoice.invoiceNumber}.pdf`;
				document.body.appendChild(link);
				link.click();
				link.remove();
				URL.revokeObjectURL(url);
			}
			toast({
				title: "Downloads started",
				description: `Generated ${selectedIds.length} PDF file(s).`,
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "Unable to download",
				description: "We couldn't generate one or more invoices. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsDownloading(false);
		}
	}, [convex, selectedIds, toast]);

	useEffect(() => {
		if (!previewInvoiceId) return;
		const stillExists = invoiceList.some(
			(invoice) => invoice._id === previewInvoiceId
		);
		if (!stillExists) {
			handlePreviewClose();
		}
	}, [handlePreviewClose, invoiceList, previewInvoiceId]);

	const columns = useInvoiceColumns({
		onStatusChange: handleStatusChange,
		statusOptions: STATUS_OPTIONS,
		disableStatusChange: isBusy,
	});

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container mx-auto px-4 py-8">
				<div className="mb-8 flex items-center justify-between gap-2">
					<h1 className="text-4xl font-bold">Invoices</h1>
					<Button asChild>
						<Link href="/invoices/new">Create Invoice</Link>
					</Button>
				</div>

				{!invoices && (
					<div className="text-muted-foreground">Loading invoices...</div>
				)}

				{invoiceList.length === 0 && invoices && (
					<Card>
						<CardHeader>
							<CardTitle>No invoices yet</CardTitle>
							<CardDescription>
								Create your first invoice to get started.
							</CardDescription>
						</CardHeader>
					</Card>
				)}

				{invoiceList.length > 0 && (
					<div className="space-y-4">
						<DataTable
							columns={columns}
							data={tableData}
							filterKey="clientName"
							filterPlaceholder="Filter by client..."
							enableRowSelection
							onSelectionChange={setSelectedInvoices}
							meta={{ onDeleteInvoice: handleDeleteInvoice, isDeleting }}
							renderToolbar={() =>
								selectedCount > 0 ? (
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-sm text-muted-foreground">
											{selectedCount} selected
										</span>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="outline" size="sm" disabled={isBusy}>
													{isBulkUpdating ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<FileText className="mr-2 h-4 w-4" />
													)}
													Set status
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="start">
												<DropdownMenuLabel>Mark selected as</DropdownMenuLabel>
												{STATUS_OPTIONS.map((option) => (
													<DropdownMenuItem
														key={option.value}
														onClick={() => handleBulkStatusChange(option.value)}
													>
														{option.label}
													</DropdownMenuItem>
												))}
											</DropdownMenuContent>
										</DropdownMenu>
										<Button
											variant="outline"
											size="sm"
											onClick={handleBulkDownload}
											disabled={isBusy}
										>
											{isDownloading ? (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											) : (
												<Download className="mr-2 h-4 w-4" />
											)}
											Download
										</Button>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="destructive" size="sm" disabled={isBusy}>
													{isDeleting ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<Trash2 className="mr-2 h-4 w-4" />
													)}
													Delete
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>
														Delete {selectedCount} invoice(s)?
													</AlertDialogTitle>
													<AlertDialogDescription>
														This action is permanent and will remove the selected invoices
														and any related records.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel disabled={isDeleting}>
														Cancel
													</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => void handleBulkDelete()}
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
									</div>
								) : null
							}
							onRowClick={handleRowPreview}
						/>
					</div>
				)}
			</main>
			<Dialog
				open={isPreviewOpen}
				onOpenChange={(open) => {
					if (!open) {
						handlePreviewClose();
					} else {
						setIsPreviewOpen(true);
					}
				}}
			>
				{isPreviewOpen ? (
					<DialogContent className="max-w-3xl space-y-6">
						{invoiceForPreview ? (
							<>
								<DialogHeader>
									<DialogTitle className="flex flex-wrap items-center gap-3 text-2xl">
										Invoice #{invoiceForPreview.invoiceNumber}
										{previewStatusOption ? (
											<Badge variant="outline" className="capitalize">
												{previewStatusOption.label}
											</Badge>
										) : null}
									</DialogTitle>
									<DialogDescription>
										Quick preview of invoice details before opening the full page.
									</DialogDescription>
								</DialogHeader>
								<div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto pr-1">
									<div className="grid gap-6 md:grid-cols-2">
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">Client</p>
											<p className="text-base font-semibold">
												{invoiceForPreview.client?.name ?? invoiceForPreview.clientName ?? "Unknown client"}
											</p>
											{invoiceForPreview.client?.email || invoiceForPreview.clientEmail ? (
												<p className="text-sm text-muted-foreground">
													{invoiceForPreview.client?.email ?? invoiceForPreview.clientEmail}
												</p>
											) : null}
											{invoiceForPreview.client?.contactPerson ? (
												<p className="text-sm text-muted-foreground">
													Contact: {invoiceForPreview.client.contactPerson}
												</p>
											) : null}
										</div>
										<div className="grid grid-cols-2 gap-4 text-sm">
											<div>
												<p className="text-muted-foreground">Issued</p>
												<p className="font-semibold">
													{format(new Date(invoiceForPreview.issueDate), "MMM d, yyyy")}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Due</p>
												<p className="font-semibold">
													{format(new Date(invoiceForPreview.dueDate), "MMM d, yyyy")}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Total</p>
												<p className="font-semibold">
													{new Intl.NumberFormat("en-US", {
														style: "currency",
														currency: "USD",
													}).format(invoiceForPreview.total)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Status</p>
												<p className="font-semibold capitalize">
													{previewStatusOption?.label ?? invoiceForPreview.status}
												</p>
											</div>
										</div>
									</div>
									<div>
										<p className="mb-2 text-sm font-medium text-muted-foreground">
											Line items
										</p>
										<div className="overflow-hidden rounded-md border">
											<table className="w-full text-sm">
												<thead className="bg-muted/50">
													<tr>
														<th className="px-4 py-2 text-left font-semibold">Description</th>
														<th className="px-4 py-2 text-right font-semibold">Qty</th>
														<th className="px-4 py-2 text-right font-semibold">Unit</th>
														<th className="px-4 py-2 text-right font-semibold">Total</th>
													</tr>
												</thead>
												<tbody>
													{invoiceForPreview.lineItems?.length ? (
														invoiceForPreview.lineItems.map((item, index) => (
															<tr
																key={`${item.description}-${index}`}
																className="border-t"
															>
																<td className="px-4 py-2">
																	{item.description}
																</td>
																<td className="px-4 py-2 text-right">
																	{item.quantity}
																</td>
																<td className="px-4 py-2 text-right">
																	{new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: "USD",
																	}).format(item.unitPrice)}
																</td>
																<td className="px-4 py-2 text-right">
																	{new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: "USD",
																	}).format(item.total)}
																</td>
															</tr>
														))
													) : (
														<tr>
															<td className="px-4 py-6 text-center text-muted-foreground" colSpan={4}>
																No line items found.
															</td>
														</tr>
													)}
											</tbody>
										</table>
										</div>
									</div>
									{invoiceForPreview.notes ? (
										<div>
											<p className="mb-2 text-sm font-medium text-muted-foreground">
												Notes
											</p>
											<p className="whitespace-pre-line rounded-md border bg-muted/30 p-3 text-sm">
												{invoiceForPreview.notes}
											</p>
										</div>
									) : null}
								</div>
								<DialogFooter className="gap-2">
									<Button variant="outline" onClick={handlePreviewClose}>
										Close
									</Button>
									<Button asChild>
										<Link href={`/invoices/${invoiceForPreview._id}`}>
											Open full invoice
										</Link>
									</Button>
								</DialogFooter>
							</>
						) : (
							<div className="flex h-40 items-center justify-center">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						)}
					</DialogContent>
				) : null}
			</Dialog>
		</div>
	);
}
