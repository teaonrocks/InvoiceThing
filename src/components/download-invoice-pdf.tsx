"use client";

import { useCallback, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { useConvex, type ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { InvoicePDF } from "./invoice-pdf";
import { format } from "date-fns";

export type DownloadInvoiceData = {
	_id: string;
	invoiceNumber: string;
	issueDate: number;
	dueDate: number;
	status: "draft" | "sent" | "paid" | "overdue";
	subtotal: number;
	tax: number;
	roundingAdjustment?: number;
	total: number;
	notes?: string;
	client: {
		name: string;
		email?: string;
		contactPerson?: string;
		streetName?: string;
		buildingName?: string;
		unitNumber?: string;
		postalCode?: string;
	} | null;
	lineItems: Array<{
		_id: string;
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}>;
	claims?: Array<{
		_id: string;
		description: string;
		amount: number;
		date: number;
		imageStorageId?: Id<"_storage">;
	}>;
};

type ConvexInvoice = DownloadInvoiceData & {
	client?: DownloadInvoiceData["client"] | null;
	lineItems?: DownloadInvoiceData["lineItems"];
	claims?: DownloadInvoiceData["claims"];
};

export function mapConvexInvoiceToDownload(
	invoice: ConvexInvoice,
): DownloadInvoiceData {
	return {
		_id: invoice._id,
		invoiceNumber: invoice.invoiceNumber,
		issueDate: invoice.issueDate,
		dueDate: invoice.dueDate,
		status: invoice.status,
		subtotal: invoice.subtotal,
		tax: invoice.tax,
		roundingAdjustment: invoice.roundingAdjustment,
		total: invoice.total,
		notes: invoice.notes,
		client: invoice.client ?? null,
		lineItems: invoice.lineItems ?? [],
		claims: invoice.claims,
	};
}

/** Minimal invoice for the download button; full data is fetched on click if needed. */
export function mapPreviewToDownloadInvoice(preview: {
	_id: Id<"invoices">;
	invoiceNumber: string;
	issueDate: number;
	dueDate: number;
	status: "draft" | "sent" | "paid" | "overdue";
	total: number;
	notes?: string | null;
	client?: {
		name: string;
		email?: string | null;
		contactPerson?: string | null;
		streetName?: string | null;
		buildingName?: string | null;
		unitNumber?: string | null;
		postalCode?: string | null;
	} | null;
}): DownloadInvoiceData {
	return {
		_id: preview._id,
		invoiceNumber: preview.invoiceNumber,
		issueDate: preview.issueDate,
		dueDate: preview.dueDate,
		status: preview.status,
		subtotal: 0,
		tax: 0,
		total: preview.total,
		notes: preview.notes ?? undefined,
		client: preview.client
			? {
					name: preview.client.name,
					email: preview.client.email ?? undefined,
					contactPerson: preview.client.contactPerson ?? undefined,
					streetName: preview.client.streetName ?? undefined,
					buildingName: preview.client.buildingName ?? undefined,
					unitNumber: preview.client.unitNumber ?? undefined,
					postalCode: preview.client.postalCode ?? undefined,
				}
			: null,
		lineItems: [],
	};
}

export async function downloadInvoicePdf(
	convex: ConvexReactClient,
	invoice: DownloadInvoiceData,
	paymentInstructions?: string,
): Promise<void> {
	let data = invoice;
	if (!data.lineItems.length) {
		const full = await convex.query(api.invoices.get, {
			invoiceId: data._id as Id<"invoices">,
		});
		if (!full?.client) {
			throw new Error("Invoice not found");
		}
		data = mapConvexInvoiceToDownload(full as ConvexInvoice);
	}

	if (!data.client) {
		throw new Error("Invoice client is required");
	}

	const claimImageUrls = await Promise.all(
		(data.claims ?? []).map(async (claim) => {
			if (!claim.imageStorageId) return undefined;
			const url = await convex.query(api.files.getFileUrl, {
				storageId: claim.imageStorageId,
			});
			return url ?? undefined;
		}),
	);

	const pdfData = {
		invoiceNumber: data.invoiceNumber,
		issueDate: format(new Date(data.issueDate), "MMMM d, yyyy"),
		dueDate: format(new Date(data.dueDate), "MMMM d, yyyy"),
		status: data.status,
		client: data.client,
		lineItems: data.lineItems,
		claims: data.claims?.map((claim, index) => ({
			description: claim.description,
			amount: claim.amount,
			date: format(new Date(claim.date), "MMM d, yyyy"),
			imageUrl: claimImageUrls[index] ?? undefined,
		})),
		subtotal: data.subtotal,
		tax: data.tax,
		roundingAdjustment: data.roundingAdjustment,
		total: data.total,
		notes: data.notes,
		paymentInstructions,
	};

	const blob = await pdf(<InvoicePDF invoice={pdfData} />).toBlob();
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `invoice-${data.invoiceNumber}.pdf`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

export async function downloadInvoicePdfById(
	convex: ConvexReactClient,
	invoiceId: Id<"invoices">,
	paymentInstructions?: string,
): Promise<void> {
	const full = await convex.query(api.invoices.get, { invoiceId });
	if (!full?.client) {
		throw new Error("Invoice not found");
	}
	await downloadInvoicePdf(
		convex,
		mapConvexInvoiceToDownload(full as ConvexInvoice),
		paymentInstructions,
	);
}

export function DownloadInvoicePDF({
	invoice,
	paymentInstructions,
	className,
	variant = "default",
	size = "sm",
	compactLabel,
}: {
	invoice: DownloadInvoiceData;
	paymentInstructions?: string;
	className?: string;
	variant?: "default" | "outline" | "ghost";
	size?: "sm" | "icon" | "default";
	compactLabel?: boolean;
}) {
	const convex = useConvex();
	const [isGenerating, setIsGenerating] = useState(false);

	const handleDownload = useCallback(async () => {
		if (isGenerating) return;

		setIsGenerating(true);
		try {
			await downloadInvoicePdf(convex, invoice, paymentInstructions);
		} catch (error) {
			console.error("Failed to generate invoice PDF:", error);
		} finally {
			setIsGenerating(false);
		}
	}, [convex, invoice, paymentInstructions, isGenerating]);

	return (
		<Button
			type="button"
			variant={variant}
			size={size}
			className={className}
			onClick={handleDownload}
			disabled={isGenerating}
			aria-label="Download PDF"
		>
			{isGenerating ? (
				<Loader2 className="h-4 w-4 animate-spin" />
			) : (
				<>
					<FileDown className="h-4 w-4" />
					{!compactLabel && size !== "icon" ? (
						<span className="ml-2">Download PDF</span>
					) : null}
				</>
			)}
		</Button>
	);
}
