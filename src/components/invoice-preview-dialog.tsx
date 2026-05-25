import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Doc, Id } from "@/../convex/_generated/dataModel";
import {
	Image as ReceiptIcon,
	ImageOff as ReceiptOffIcon,
	Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAddressParts } from "@/lib/utils";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

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

export type InvoicePreviewFallback = Doc<"invoices"> & {
	client?: Doc<"clients"> | null;
};

const STATUS_OPTIONS = [
	{ value: "draft" as const, label: "Draft" },
	{ value: "sent" as const, label: "Sent" },
	{ value: "paid" as const, label: "Paid" },
	{ value: "overdue" as const, label: "Overdue" },
];

function normalizePreview(invoice: InvoiceWithRelations): InvoicePreview {
	return {
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
	};
}

function normalizeFromList(invoice: InvoicePreviewFallback): InvoicePreview {
	return {
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
	};
}

export function InvoicePreviewDialog({
	invoiceId,
	open,
	onOpenChange,
	fallbackInvoices = [],
}: {
	invoiceId: Id<"invoices"> | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	fallbackInvoices?: InvoicePreviewFallback[];
}) {
	const [previewCache, setPreviewCache] = useState<
		Record<string, InvoicePreview>
	>({});

	const previewInvoice = useQuery(
		api.invoices.get,
		open && invoiceId ? { invoiceId } : "skip",
	);

	const normalizedPreview = useMemo(() => {
		if (!previewInvoice) return null;
		return normalizePreview(previewInvoice as InvoiceWithRelations);
	}, [previewInvoice]);

	useEffect(() => {
		if (!normalizedPreview) return;
		setPreviewCache((current) => ({
			...current,
			[normalizedPreview._id]: normalizedPreview,
		}));
	}, [normalizedPreview]);

	const invoiceForPreview = useMemo(() => {
		if (normalizedPreview) return normalizedPreview;
		if (!invoiceId) return null;

		const cached = previewCache[invoiceId];
		if (cached) return cached;

		const fallback = fallbackInvoices.find((invoice) => invoice._id === invoiceId);
		if (fallback) return normalizeFromList(fallback);

		return null;
	}, [normalizedPreview, invoiceId, previewCache, fallbackInvoices]);

	const previewStatusOption = useMemo(() => {
		if (!invoiceForPreview) return undefined;
		return STATUS_OPTIONS.find(
			(option) => option.value === invoiceForPreview.status,
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

	const handleClose = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			{open ? (
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
														"MMM d, yyyy",
													)}
												</p>
											</div>
											<div>
												<p className="text-muted-foreground">Due</p>
												<p className="font-semibold">
													{format(
														new Date(invoiceForPreview.dueDate),
														"MMM d, yyyy",
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
																				"MMM d, yyyy",
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
																				<span className="mx-auto inline-flex h-6 w-6 items-center justify-center text-muted-foreground">
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
																				<span className="mx-auto inline-flex h-6 w-6 items-center justify-center text-muted-foreground">
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
									<Button variant="outline" onClick={handleClose}>
										Close
									</Button>
									<Button asChild>
										<Link
											to="/invoices/$id"
											params={{ id: invoiceForPreview._id }}
											onClick={handleClose}
										>
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
	);
}
