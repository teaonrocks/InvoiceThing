"use client";

import { useState, useEffect } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { InvoicePDF } from "./invoice-pdf";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

type Invoice = {
	_id: string;
	invoiceNumber: string;
	issueDate: number;
	dueDate: number;
	status: "draft" | "sent" | "paid" | "overdue";
	subtotal: number;
	tax: number;
	total: number;
	notes?: string;
	client: {
		name: string;
		email?: string;
		address?: string;
		contactPerson?: string;
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

export function DownloadInvoicePDF({ invoice }: { invoice: Invoice }) {
	const [isClient, setIsClient] = useState(false);

	// Collect all storage IDs from claims
	const storageIds =
		invoice.claims?.map((claim) => claim.imageStorageId).filter(Boolean) || [];

	// Fetch all image URLs (call hooks unconditionally)
	const imageUrls = storageIds.map((storageId) =>
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useQuery(api.files.getFileUrl, storageId ? { storageId } : "skip")
	);

	// Only render PDF component on client side
	useEffect(() => {
		setIsClient(true);
	}, []);

	// Check if all image URLs are loaded
	const allImagesLoaded = imageUrls.every((url) => url !== undefined);

	if (
		!isClient ||
		!invoice.client ||
		(storageIds.length > 0 && !allImagesLoaded)
	) {
		return (
			<Button disabled>
				<Loader2 className="h-4 w-4 mr-2 animate-spin" />
				Loading PDF...
			</Button>
		);
	}

	// Create a map of storageId to imageUrl for easy lookup
	const imageUrlMap = new Map<Id<"_storage">, string>();
	storageIds.forEach((storageId, index) => {
		if (storageId && imageUrls[index]) {
			imageUrlMap.set(storageId, imageUrls[index]!);
		}
	});

	const pdfData = {
		invoiceNumber: invoice.invoiceNumber,
		issueDate: format(new Date(invoice.issueDate), "MMMM d, yyyy"),
		dueDate: format(new Date(invoice.dueDate), "MMMM d, yyyy"),
		status: invoice.status,
		client: invoice.client,
		lineItems: invoice.lineItems,
		claims: invoice.claims?.map((claim) => ({
			description: claim.description,
			amount: claim.amount,
			date: format(new Date(claim.date), "MMM d, yyyy"),
			imageUrl: claim.imageStorageId
				? imageUrlMap.get(claim.imageStorageId)
				: undefined,
		})),
		subtotal: invoice.subtotal,
		tax: invoice.tax,
		total: invoice.total,
		notes: invoice.notes,
	};

	return (
		<PDFDownloadLink
			document={<InvoicePDF invoice={pdfData} />}
			fileName={`invoice-${invoice.invoiceNumber}.pdf`}
		>
			{({ loading }) =>
				loading ? (
					<Button disabled>
						<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						Generating PDF...
					</Button>
				) : (
					<Button>
						<FileDown className="h-4 w-4 mr-2" />
						Download PDF
					</Button>
				)
			}
		</PDFDownloadLink>
	);
}
