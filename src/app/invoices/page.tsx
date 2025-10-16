"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery, useMutation, useConvex } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Doc, Id } from "@/../convex/_generated/dataModel";
import { pdf } from "@react-pdf/renderer";
import {
	Download,
	FileText,
	Image as ReceiptIcon,
	ImageOff as ReceiptOffIcon,
	Loader2,
	Trash2,
} from "lucide-react";

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
import { useAppData } from "@/context/app-data-provider";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAddressParts } from "@/lib/utils";

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
		streetName?: string | null;
		buildingName?: string | null;
		unitNumber?: string | null;
		postalCode?: string | null;
	} | null;
	lineItems?: {
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}[];
	claims?: {
		description: string;
		amount: number;
		date?: number;
		hasReceipt?: boolean;
	}[];
};

type InvoiceWithRelations = Doc<"invoices"> & {
	client?: Doc<"clients"> | null;
	lineItems?: Doc<"lineItems">[];
	claims?: Doc<"claims">[];
};

type InvoiceListEntry = Doc<"invoices"> & {
	client?: Doc<"clients"> | null;
};

export default function InvoicesPage() {
	const { toast } = useToast();
	const convex = useConvex();
	const { invoices: cachedInvoices, currentUser } = useAppData();
	const invoices = cachedInvoices;

	const settings = useQuery(
		api.settings.get,
		currentUser?._id ? { userId: currentUser._id } : "skip"
	);

	const updateStatus = useMutation(api.invoices.updateStatus);
	const updateStatusBulk = useMutation(api.invoices.updateStatusBulk);
	const deleteInvoices = useMutation(api.invoices.removeMany);

	const [selectedInvoices, setSelectedInvoices] = useState<InvoiceRow[]>([]);
	const [isBulkUpdating, setIsBulkUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isStatusUpdating, setIsStatusUpdating] = useState(false);
	const [previewInvoiceId, setPreviewInvoiceId] =
		useState<Id<"invoices"> | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewCache, setPreviewCache] = useState<
		Record<string, InvoicePreview>
	>({});

	const invoiceList = useMemo(() => invoices ?? [], [invoices]);

	const previewInvoice = useQuery(
		api.invoices.get,
		previewInvoiceId ? { invoiceId: previewInvoiceId } : "skip"
	);

	const normalizePreview = useCallback(
		(invoice: InvoiceWithRelations): InvoicePreview => ({
			_id: invoice._id,
			invoiceNumber: invoice.invoiceNumber,
			status: invoice.status as InvoiceStatus,
			issueDate: invoice.issueDate,
			dueDate: invoice.dueDate,
			total: invoice.total,
			notes: invoice.notes ?? null,
			clientName: invoice.client?.name ?? undefined,
			clientEmail: invoice.client?.email ?? null,
			client: invoice.client
				? {
						name: invoice.client.name,
						email: invoice.client.email ?? null,
					contactPerson: invoice.client.contactPerson ?? null,
					streetName: invoice.client.streetName ?? null,
					buildingName: invoice.client.buildingName ?? null,
					unitNumber: invoice.client.unitNumber ?? null,
					postalCode: invoice.client.postalCode ?? null,
					}
				: null,
			lineItems: (invoice.lineItems ?? []).map((item) => ({
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				total: item.total,
			})),
			claims: (invoice.claims ?? []).map((claim) => ({
				description: claim.description,
				amount: claim.amount,
				date: claim.date,
				hasReceipt: Boolean(claim.imageStorageId),
			})),
		}),
		[]
	);

	const normalizeFromList = useCallback(
		(invoice: InvoiceListEntry): InvoicePreview => ({
			_id: invoice._id,
			invoiceNumber: invoice.invoiceNumber,
			status: invoice.status as InvoiceStatus,
			issueDate: invoice.issueDate,
			dueDate: invoice.dueDate,
			total: invoice.total,
			notes: invoice.notes ?? null,
			clientName: invoice.client?.name ?? undefined,
			clientEmail: invoice.client?.email ?? null,
			client: invoice.client
				? {
						name: invoice.client.name,
						email: invoice.client.email ?? null,
					contactPerson: invoice.client.contactPerson ?? null,
					streetName: invoice.client.streetName ?? null,
					buildingName: invoice.client.buildingName ?? null,
					unitNumber: invoice.client.unitNumber ?? null,
					postalCode: invoice.client.postalCode ?? null,
					}
				: null,
			lineItems: [],
			claims: [],
		}),
		[]
	);

	const normalizedPreview = useMemo(() => {
		if (!previewInvoice) return null;
		return normalizePreview(previewInvoice as InvoiceWithRelations);
	}, [normalizePreview, previewInvoice]);

	useEffect(() => {
		if (!normalizedPreview) return;
		setPreviewCache((current) => ({
			...current,
			[normalizedPreview._id]: normalizedPreview,
		}));
	}, [normalizedPreview]);

	const invoiceForPreview = useMemo(() => {
		if (normalizedPreview) {
			return normalizedPreview;
		}

		if (!previewInvoiceId) {
			return null;
		}

		const cached = previewCache[previewInvoiceId];
		if (cached) {
			return cached;
		}

		const fallback = invoiceList.find(
			(invoice) => invoice._id === previewInvoiceId
		);
		if (fallback) {
			return normalizeFromList(fallback as InvoiceListEntry);
		}

		return null;
	}, [
		normalizedPreview,
		previewInvoiceId,
		previewCache,
		invoiceList,
		normalizeFromList,
	]);

	const previewStatusOption = useMemo(() => {
		if (!invoiceForPreview) return undefined;
		return STATUS_OPTIONS.find(
			(option) => option.value === invoiceForPreview.status
		);
	}, [invoiceForPreview]);

	const previewAddress = useMemo(() => {
		const client = invoiceForPreview?.client;
		if (!client) return undefined;
		return formatAddressParts({
			streetName: client.streetName ?? undefined,
			buildingName: client.buildingName ?? undefined,
			unitNumber: client.unitNumber ?? undefined,
			postalCode: client.postalCode ?? undefined,
		});
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
	const isBusy =
		isBulkUpdating || isDeleting || isDownloading || isStatusUpdating;

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
					description:
						"We couldn't update the invoice status. Please try again.",
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
	}, [
		deleteInvoices,
		handlePreviewClose,
		previewInvoiceId,
		selectedIds,
		toast,
	]);

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
						email: invoice.client.email ?? undefined,
						contactPerson: invoice.client.contactPerson ?? undefined,
						streetName: invoice.client.streetName ?? undefined,
						buildingName: invoice.client.buildingName ?? undefined,
						unitNumber: invoice.client.unitNumber ?? undefined,
						postalCode: invoice.client.postalCode ?? undefined,
					}
					: {
						name: "Unknown client",
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
					paymentInstructions: settings?.paymentInstructions,
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
				description:
					"We couldn't generate one or more invoices. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsDownloading(false);
		}
	}, [convex, selectedIds, toast, settings?.paymentInstructions]);

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
			<main className="container mx-auto px-4 py-4 sm:py-8">
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-3xl font-bold sm:text-4xl">Invoices</h1>
					<Button asChild className="w-full sm:w-auto">
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
									<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
										<span className="text-sm text-muted-foreground">
											{selectedCount} selected
										</span>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													className="w-full sm:w-auto"
													disabled={isBusy}
												>
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
											className="w-full sm:w-auto"
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
												<Button
													variant="destructive"
													size="sm"
													className="w-full sm:w-auto"
													disabled={isBusy}
												>
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
														This action is permanent and will remove the
														selected invoices and any related records.
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
						<TooltipProvider delayDuration={150}>
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
											Quick preview of invoice details before opening the full
											page.
										</DialogDescription>
									</DialogHeader>
									<div className="flex max-h-[60vh] flex-col gap-6 overflow-y-auto pr-1">
										<div className="grid gap-6 md:grid-cols-2">
											<div className="space-y-2">
												<p className="text-sm font-medium text-muted-foreground">
													Client
												</p>
												<p className="text-base font-semibold">
													{invoiceForPreview.client?.name ??
														invoiceForPreview.clientName ??
														"Unknown client"}
												</p>
												{invoiceForPreview.client?.email ||
												invoiceForPreview.clientEmail ? (
													<p className="text-sm text-muted-foreground">
														{invoiceForPreview.client?.email ??
															invoiceForPreview.clientEmail}
													</p>
												) : null}
												{invoiceForPreview.client?.contactPerson ? (
													<p className="text-sm text-muted-foreground">
														Contact: {invoiceForPreview.client.contactPerson}
													</p>
												) : null}
												{previewAddress ? (
													<p className="text-sm text-muted-foreground">
														{previewAddress}
													</p>
												) : null}
											</div>
											<div className="grid grid-cols-2 gap-4 text-sm">
												<div>
													<p className="text-muted-foreground">Issued</p>
													<p className="font-semibold">
														{format(
															new Date(invoiceForPreview.issueDate),
															"MMM d, yyyy"
														)}
													</p>
												</div>
												<div>
													<p className="text-muted-foreground">Due</p>
													<p className="font-semibold">
														{format(
															new Date(invoiceForPreview.dueDate),
															"MMM d, yyyy"
														)}
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
														{previewStatusOption?.label ??
															invoiceForPreview.status}
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
															<th className="px-4 py-2 text-left font-semibold">
																Description
															</th>
															<th className="px-4 py-2 text-right font-semibold">
																Qty
															</th>
															<th className="px-4 py-2 text-right font-semibold">
																Unit
															</th>
															<th className="px-4 py-2 text-right font-semibold">
																Total
															</th>
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
																<td
																	className="px-4 py-6 text-center text-muted-foreground"
																	colSpan={4}
																>
																	No line items found.
																</td>
															</tr>
														)}
													</tbody>
												</table>
											</div>
										</div>
										{invoiceForPreview.claims &&
										invoiceForPreview.claims.length > 0 ? (
											<div>
												<p className="mb-2 mt-6 text-sm font-medium text-muted-foreground">
													Reimbursable expenses
												</p>
												<div className="overflow-hidden rounded-md border">
													<table className="w-full text-sm">
														<thead className="bg-muted/50">
															<tr>
																<th className="px-4 py-2 text-left font-semibold">
																	Description
																</th>
																<th className="px-4 py-2 text-left font-semibold">
																	Date
																</th>
																<th className="px-4 py-2 text-right font-semibold">
																	Amount
																</th>
																<th className="px-4 py-2 text-center font-semibold">
																	Receipt
																</th>
															</tr>
														</thead>
														<tbody>
															{invoiceForPreview.claims.map((claim, index) => (
																<tr
																	key={`${claim.description}-${index}`}
																	className="border-t"
																>
																	<td className="px-4 py-2">
																		{claim.description}
																	</td>
																	<td className="px-4 py-2">
																		{claim.date
																			? format(
																					new Date(claim.date),
																					"MMM d, yyyy"
																				)
																			: "—"}
																	</td>
																	<td className="px-4 py-2 text-right">
																		{new Intl.NumberFormat("en-US", {
																			style: "currency",
																			currency: "USD",
																		}).format(claim.amount)}
																	</td>
																	<td className="px-4 py-2 text-center">
																		{claim.hasReceipt ? (
																			<Tooltip>
																				<TooltipTrigger
																					asChild
																					aria-label="Receipt attached"
																				>
																					<span className="mx-auto inline-flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
																						<ReceiptIcon
																							className="h-4 w-4"
																							aria-hidden="true"
																						/>
																					</span>
																				</TooltipTrigger>
																				<TooltipContent side="top">
																					Receipt attached
																				</TooltipContent>
																			</Tooltip>
																		) : (
																			<Tooltip>
																				<TooltipTrigger
																					asChild
																					aria-label="No receipt"
																				>
																					<span className="mx-auto inline-flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
																						<ReceiptOffIcon
																							className="h-4 w-4"
																							aria-hidden="true"
																						/>
																					</span>
																				</TooltipTrigger>
																				<TooltipContent side="top">
																					No receipt uploaded
																				</TooltipContent>
																			</Tooltip>
																		)}
																	</td>
																</tr>
															))}
														</tbody>
													</table>
												</div>
											</div>
										) : null}
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
						</TooltipProvider>
					</DialogContent>
				) : null}
			</Dialog>
		</div>
	);
}
