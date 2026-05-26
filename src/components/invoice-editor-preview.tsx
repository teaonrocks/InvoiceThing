import { format } from "date-fns";
import type { Doc } from "@/../convex/_generated/dataModel";
import { formatAddressParts } from "@/lib/utils";
import { formatInvoiceCurrency } from "@/lib/invoice-format";
import { applyInvoiceTotalRounding } from "@/lib/invoice-rounding";
import type { InvoiceBranding } from "@/lib/invoice-branding";
import {
	buildInvoiceBranding,
	DEFAULT_INVOICE_ACCENT_COLOR,
	DEFAULT_INVOICE_SECONDARY_COLOR,
	getInvoiceTextColors,
} from "@/lib/invoice-branding";
import { useInvoiceBrandingFont } from "@/hooks/use-invoice-branding-font";
import type {
	InvoiceFormClaim,
	InvoiceFormLineItem,
} from "@/components/invoice-form-ui";
import { cn } from "@/lib/utils";

export type InvoiceEditorPreviewData = {
	invoiceNumber: string;
	issueDate?: Date;
	dueDate?: Date;
	client: Doc<"clients"> | null;
	lineItems: {
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
		isPlaceholder?: boolean;
	}[];
	claims: {
		description: string;
		amount: number;
		date: Date;
		hasReceipt: boolean;
	}[];
	notes?: string;
	subtotal: number;
	expensesTotal: number;
	tax: number;
	total: number;
	taxRate: number;
	roundingAdjustment?: number;
	paymentInstructions?: string;
	branding?: InvoiceBranding;
};

type InvoiceWithRelations = {
	invoiceNumber: string;
	issueDate: number;
	dueDate: number;
	subtotal: number;
	tax: number;
	total: number;
	roundingAdjustment?: number;
	notes?: string;
	client?: Doc<"clients"> | null;
	lineItems?: {
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}[];
	claims?: {
		description: string;
		amount: number;
		date: number;
		imageStorageId?: string;
	}[];
};

export function buildInvoicePreviewDataFromRecord(
	invoice: InvoiceWithRelations,
	paymentInstructions?: string,
	branding?: InvoiceBranding,
): InvoiceEditorPreviewData {
	const expensesTotal = (invoice.claims ?? []).reduce(
		(sum, claim) => sum + claim.amount,
		0,
	);
	const taxableBase = invoice.subtotal + expensesTotal;
	const taxRate = taxableBase > 0 ? invoice.tax / taxableBase : 0;

	return {
		invoiceNumber: invoice.invoiceNumber,
		issueDate: new Date(invoice.issueDate),
		dueDate: new Date(invoice.dueDate),
		client: invoice.client ?? null,
		lineItems: (invoice.lineItems ?? []).map((item) => ({
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			total: item.total,
		})),
		claims: (invoice.claims ?? []).map((claim) => ({
			description: claim.description,
			amount: claim.amount,
			date: new Date(claim.date),
			hasReceipt: Boolean(claim.imageStorageId),
		})),
		notes: invoice.notes,
		subtotal: invoice.subtotal,
		expensesTotal,
		tax: invoice.tax,
		total: invoice.total,
		taxRate,
		roundingAdjustment: invoice.roundingAdjustment,
		paymentInstructions: paymentInstructions?.trim() || undefined,
		branding: branding ?? buildInvoiceBranding(),
	};
}

export function buildInvoiceEditorPreviewData({
	invoiceNumber,
	issueDate,
	dueDate,
	selectedClientId,
	clients,
	lineItems,
	claims,
	notes,
	subtotal,
	expensesTotal,
	tax,
	taxRate,
	paymentInstructions,
	enableRounding,
	roundingIncrement,
	branding,
}: {
	invoiceNumber: string;
	issueDate?: Date;
	dueDate?: Date;
	selectedClientId: string;
	clients: Doc<"clients">[] | undefined;
	lineItems: InvoiceFormLineItem[];
	claims: InvoiceFormClaim[];
	notes: string;
	subtotal: number;
	expensesTotal: number;
	tax: number;
	taxRate: number;
	paymentInstructions?: string;
	enableRounding?: boolean;
	roundingIncrement?: number;
	branding?: InvoiceBranding;
}): InvoiceEditorPreviewData {
	const client =
		clients?.find((entry) => entry._id === selectedClientId) ?? null;

	const totalBeforeRounding = subtotal + expensesTotal + tax;
	const { total: roundedTotal, roundingAdjustment } = applyInvoiceTotalRounding(
		totalBeforeRounding,
		{ enableRounding, roundingIncrement },
	);

	return {
		invoiceNumber: invoiceNumber.trim() || "DRAFT",
		issueDate,
		dueDate,
		client,
		lineItems: lineItems.map((item) => {
			const description = item.description.trim();
			return {
				description: description || "Item description",
				quantity: item.quantity,
				unitPrice: item.rate,
				total: item.quantity * item.rate,
				isPlaceholder: !description,
			};
		}),
		claims: claims.map((claim) => ({
			description: claim.description.trim() || "Expense",
			amount: claim.amount,
			date: claim.date,
			hasReceipt: Boolean(claim.imageStorageId),
		})),
		notes: notes.trim() || undefined,
		subtotal,
		expensesTotal,
		tax,
		total: roundedTotal,
		taxRate,
		roundingAdjustment,
		paymentInstructions: paymentInstructions?.trim() || undefined,
		branding: branding ?? buildInvoiceBranding(),
	};
}

function PreviewTableHead({
	children,
	className,
	color,
}: {
	children: React.ReactNode;
	className?: string;
	color: string;
}) {
	return (
		<th
			className={cn(
				"border-b-2 pb-2 text-left text-[10px] font-semibold tracking-wider uppercase sm:text-xs",
				className,
			)}
			style={{ borderColor: color, color }}
		>
			{children}
		</th>
	);
}

function PreviewTableCell({
	children,
	className,
	colSpan,
}: {
	children: React.ReactNode;
	className?: string;
	colSpan?: number;
}) {
	return (
		<td
			colSpan={colSpan}
			className={cn("py-2.5 align-top text-xs sm:text-sm", className)}
		>
			{children}
		</td>
	);
}

export function InvoiceEditorPreview({
	data,
	showLabel = true,
}: {
	data: InvoiceEditorPreviewData;
	showLabel?: boolean;
}) {
	const branding = data.branding ?? buildInvoiceBranding();
	useInvoiceBrandingFont(branding.fontKey);

	const accentColor = branding.accentColor ?? DEFAULT_INVOICE_ACCENT_COLOR;
	const secondaryColor =
		branding.secondaryColor ?? DEFAULT_INVOICE_SECONDARY_COLOR;
	const textColors = getInvoiceTextColors(accentColor, secondaryColor);

	const clientAddress = data.client
		? formatAddressParts({
				streetName: data.client.streetName ?? undefined,
				buildingName: data.client.buildingName ?? undefined,
				unitNumber: data.client.unitNumber ?? undefined,
				postalCode: data.client.postalCode ?? undefined,
			})
		: undefined;

	const hasLineItems = data.lineItems.length > 0;
	const hasClaims = data.claims.length > 0;

	const showRounding =
		data.roundingAdjustment !== undefined &&
		Math.abs(data.roundingAdjustment) >= 0.001;

	return (
		<div className="flex h-full min-h-[28rem] flex-col lg:min-h-0">
			{showLabel ? (
				<p className="mb-3 shrink-0 text-xs font-medium tracking-wide uppercase text-muted-foreground">
					Live preview
				</p>
			) : null}
			<div
				className="invoice-preview flex-1 overflow-hidden rounded-sm border border-border shadow-md"
				style={
					{
						fontFamily: branding.fontCssFamily,
						backgroundColor: secondaryColor,
						"--invoice-fg": textColors.foreground,
						"--invoice-muted": textColors.mutedForeground,
					} as React.CSSProperties
				}
				aria-live="polite"
				aria-label="Invoice preview"
			>
				<div className="min-h-full p-6 sm:p-8 lg:p-10">
					<div
						className="flex flex-col gap-4 border-b-2 pb-6 sm:flex-row sm:items-start sm:justify-between"
						style={{ borderColor: `${textColors.accent}33` }}
					>
						<div>
							<h2
								className="text-3xl font-bold tracking-tight sm:text-4xl"
								style={{ color: textColors.accent }}
							>
								INVOICE
							</h2>
							<p className="font-number mt-1 text-sm invoice-text-muted sm:text-base">
								#{data.invoiceNumber}
							</p>
						</div>
						{branding.logoUrl ? (
							<img
								src={branding.logoUrl}
								alt="Company logo"
								className="max-h-14 max-w-[10rem] self-start object-contain sm:max-h-16 sm:max-w-[12rem]"
							/>
						) : null}
					</div>

					<div className="mt-6 grid grid-cols-2 gap-4 text-xs sm:text-sm">
						<div>
							<p className="font-medium invoice-text-muted">Issue date</p>
							<p className="font-number mt-0.5 font-semibold">
								{data.issueDate
									? format(data.issueDate, "MMM d, yyyy")
									: "—"}
							</p>
						</div>
						<div>
							<p className="font-medium invoice-text-muted">Due date</p>
							<p className="font-number mt-0.5 font-semibold">
								{data.dueDate ? format(data.dueDate, "MMM d, yyyy") : "—"}
							</p>
						</div>
					</div>

					<div className="mt-8">
						<p
							className="text-[10px] font-semibold tracking-wider uppercase"
							style={{ color: textColors.accent }}
						>
							Bill to
						</p>
						{data.client ? (
							<div className="mt-2 space-y-1">
								<p className="text-base font-semibold">{data.client.name}</p>
								{data.client.contactPerson ? (
									<p className="text-xs invoice-text-muted">
										Attn: {data.client.contactPerson}
									</p>
								) : null}
								{data.client.email ? (
									<p className="text-xs invoice-text-muted">
										{data.client.email}
									</p>
								) : null}
								{clientAddress ? (
									<p className="text-xs leading-relaxed invoice-text-muted">
										{clientAddress}
									</p>
								) : null}
							</div>
						) : (
							<p className="mt-2 text-sm italic invoice-text-muted">
								Select a client to preview
							</p>
						)}
					</div>

					<div className="mt-8">
						<table className="w-full border-collapse">
							<thead>
								<tr>
									<PreviewTableHead color={textColors.accent}>
										Description
									</PreviewTableHead>
									<PreviewTableHead
										color={textColors.accent}
										className="w-12 text-right"
									>
										Qty
									</PreviewTableHead>
									<PreviewTableHead
										color={textColors.accent}
										className="w-20 text-right"
									>
										Rate
									</PreviewTableHead>
									<PreviewTableHead
										color={textColors.accent}
										className="w-20 text-right"
									>
										Amount
									</PreviewTableHead>
								</tr>
							</thead>
							<tbody>
								{hasLineItems ? (
									data.lineItems.map((item, index) => (
										<tr
											key={index}
											className="border-b last:border-0"
											style={{ borderColor: `${textColors.border}99` }}
										>
											<PreviewTableCell
												className={cn(
													item.isPlaceholder && "italic invoice-text-muted",
												)}
											>
												{item.description}
											</PreviewTableCell>
											<PreviewTableCell className="font-number text-right">
												{item.quantity}
											</PreviewTableCell>
											<PreviewTableCell className="font-number text-right">
												{formatInvoiceCurrency(item.unitPrice)}
											</PreviewTableCell>
											<PreviewTableCell className="font-number text-right font-medium">
												{formatInvoiceCurrency(item.total)}
											</PreviewTableCell>
										</tr>
									))
								) : (
									<tr>
										<PreviewTableCell
											colSpan={4}
											className="py-8 text-center italic invoice-text-muted"
										>
											Add line items to see them here
										</PreviewTableCell>
									</tr>
								)}
							</tbody>
						</table>
					</div>

					{hasClaims ? (
						<div className="mt-8">
							<p
								className="mb-3 text-[10px] font-semibold tracking-wider uppercase"
								style={{ color: textColors.accent }}
							>
								Reimbursable expenses
							</p>
							<table className="w-full border-collapse">
								<thead>
									<tr>
										<PreviewTableHead color={textColors.accent}>
											Description
										</PreviewTableHead>
										<PreviewTableHead
											color={textColors.accent}
											className="w-24"
										>
											Date
										</PreviewTableHead>
										<PreviewTableHead
											color={textColors.accent}
											className="w-20 text-right"
										>
											Amount
										</PreviewTableHead>
									</tr>
								</thead>
								<tbody>
									{data.claims.map((claim, index) => (
										<tr
											key={index}
											className="border-b last:border-0"
											style={{ borderColor: `${textColors.border}99` }}
										>
											<PreviewTableCell>
												{claim.description}
												{claim.hasReceipt ? (
													<span className="mt-0.5 block text-[10px] invoice-text-muted">
														Receipt attached
													</span>
												) : null}
											</PreviewTableCell>
											<PreviewTableCell className="font-number">
												{format(claim.date, "MMM d, yyyy")}
											</PreviewTableCell>
											<PreviewTableCell className="font-number text-right font-medium">
												{formatInvoiceCurrency(claim.amount)}
											</PreviewTableCell>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : null}

					<div
						className={cn(
							"mt-8 flex flex-col gap-6",
							data.paymentInstructions &&
								"sm:flex-row sm:items-start sm:justify-between",
						)}
					>
						{data.paymentInstructions ? (
							<div className="max-w-[14rem] shrink-0">
								<p
									className="text-[10px] font-semibold tracking-wider uppercase"
									style={{ color: textColors.accent }}
								>
									Payment information
								</p>
								<p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed invoice-text-muted">
									{data.paymentInstructions}
								</p>
							</div>
						) : null}

						<div
							className="ml-auto w-full max-w-[12rem] space-y-1.5 rounded-sm p-3 text-xs"
							style={{ backgroundColor: `${secondaryColor}CC` }}
						>
							<div className="flex justify-between gap-4">
								<span className="invoice-text-muted">Subtotal</span>
								<span className="font-number font-medium tabular-nums">
									{formatInvoiceCurrency(data.subtotal)}
								</span>
							</div>
							{data.expensesTotal > 0 ? (
								<div className="flex justify-between gap-4">
									<span className="invoice-text-muted">Expenses</span>
									<span className="font-number font-medium tabular-nums">
										{formatInvoiceCurrency(data.expensesTotal)}
									</span>
								</div>
							) : null}
							{data.taxRate > 0 ? (
								<div className="flex justify-between gap-4">
									<span className="invoice-text-muted">
										Tax ({(data.taxRate * 100).toFixed(1)}%)
									</span>
									<span className="font-number font-medium tabular-nums">
										{formatInvoiceCurrency(data.tax)}
									</span>
								</div>
							) : null}
							{showRounding ? (
								<div className="flex justify-between gap-4">
									<span className="invoice-text-muted">Rounding</span>
									<span className="font-number font-medium tabular-nums">
										{data.roundingAdjustment! > 0 ? "+" : ""}
										{formatInvoiceCurrency(data.roundingAdjustment!)}
									</span>
								</div>
							) : null}
							<div
								className="flex justify-between gap-4 border-t pt-2"
								style={{ borderColor: textColors.accent }}
							>
								<span className="font-semibold" style={{ color: textColors.accent }}>
									Total
								</span>
								<span
									className="font-number text-base font-bold tabular-nums"
									style={{ color: textColors.accent }}
								>
									{formatInvoiceCurrency(data.total)}
								</span>
							</div>
						</div>
					</div>

					{data.notes ? (
						<div
							className="mt-8 rounded-sm border-t pt-6"
							style={{
								borderColor: `${textColors.accent}33`,
								backgroundColor: `${secondaryColor}99`,
							}}
						>
							<p
								className="text-[10px] font-semibold tracking-wider uppercase"
								style={{ color: textColors.accent }}
							>
								Notes
							</p>
							<p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed">
								{data.notes}
							</p>
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}
