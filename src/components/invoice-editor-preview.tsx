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
	INVOICE_LOGO_MAX_WIDTH,
} from "@/lib/invoice-branding";
import { useInvoiceBrandingFont } from "@/hooks/use-invoice-branding-font";
import { InvoiceLogoImage } from "@/components/invoice-logo-image";
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
				"border-b-2 pb-2 text-left text-xs font-bold uppercase",
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
			className={cn("border-b py-2 align-top text-sm", className)}
			style={{ borderColor: "var(--invoice-border, rgba(0,0,0,0.1))" }}
		>
			{children}
		</td>
	);
}

function PreviewLabelRow({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="mb-1.5 flex text-sm">
			<span className="w-[7.5rem] shrink-0 font-bold invoice-text-muted">
				{label}
			</span>
			<span className="font-number min-w-0 flex-1">{value}</span>
		</div>
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
						color: textColors.foreground,
						"--invoice-fg": textColors.foreground,
						"--invoice-muted": textColors.mutedForeground,
						"--invoice-border": textColors.border,
					} as React.CSSProperties
				}
				aria-live="polite"
				aria-label="Invoice preview"
			>
				<div className="min-h-full p-6 text-sm leading-relaxed sm:p-8 lg:p-10">
					<div className="relative mb-8">
						{branding.logoUrl ? (
							<InvoiceLogoImage
								src={branding.logoUrl}
								className="absolute top-0 right-0"
							/>
						) : null}
						<div
							style={{
								paddingRight: branding.logoUrl
									? INVOICE_LOGO_MAX_WIDTH + 16
									: undefined,
							}}
						>
							<h2
								className="mb-2 text-3xl font-bold leading-none sm:text-4xl"
								style={{ color: textColors.accent }}
							>
								INVOICE
							</h2>
							<p className="font-number text-sm invoice-text-muted">
								#{data.invoiceNumber}
							</p>
						</div>
					</div>

					<div className="mb-6">
						<PreviewLabelRow
							label="Issue Date:"
							value={
								data.issueDate
									? format(data.issueDate, "MMMM d, yyyy")
									: "—"
							}
						/>
						<PreviewLabelRow
							label="Due Date:"
							value={
								data.dueDate ? format(data.dueDate, "MMMM d, yyyy") : "—"
							}
						/>
					</div>

					<div className="mb-6">
						<p
							className="mb-2 text-sm font-bold"
							style={{ color: textColors.accent }}
						>
							Bill To:
						</p>
						{data.client ? (
							<div>
								<p className="mb-1 text-sm font-bold">{data.client.name}</p>
								{data.client.contactPerson ? (
									<p className="mb-1 text-sm">
										Attn: {data.client.contactPerson}
									</p>
								) : null}
								{data.client.email ? (
									<p className="mb-1 text-sm">{data.client.email}</p>
								) : null}
								{clientAddress ? (
									<p className="text-sm invoice-text-muted">{clientAddress}</p>
								) : null}
							</div>
						) : (
							<p className="text-sm italic invoice-text-muted">
								Select a client to preview
							</p>
						)}
					</div>

					<div className="my-6">
						<table className="w-full table-fixed border-collapse">
							<colgroup>
								<col />
								<col className="w-14" />
								<col className="w-[7.5rem]" />
								<col className="w-[7.5rem]" />
							</colgroup>
							<thead>
								<tr>
									<PreviewTableHead color={textColors.accent}>
										Description
									</PreviewTableHead>
									<PreviewTableHead
										color={textColors.accent}
										className="text-right"
									>
										Qty
									</PreviewTableHead>
									<PreviewTableHead
										color={textColors.accent}
										className="pl-3 text-right"
									>
										Rate
									</PreviewTableHead>
									<PreviewTableHead
										color={textColors.accent}
										className="pl-3 text-right"
									>
										Amount
									</PreviewTableHead>
								</tr>
							</thead>
							<tbody>
								{hasLineItems ? (
									data.lineItems.map((item, index) => (
										<tr key={index}>
											<PreviewTableCell
												className={cn(
													"pr-3",
													item.isPlaceholder && "italic invoice-text-muted",
												)}
											>
												{item.description}
											</PreviewTableCell>
											<PreviewTableCell className="font-number text-right">
												{item.quantity}
											</PreviewTableCell>
											<PreviewTableCell className="font-number pl-3 text-right">
												{formatInvoiceCurrency(item.unitPrice)}
											</PreviewTableCell>
											<PreviewTableCell className="font-number pl-3 text-right">
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
						<div className="my-6">
							<p
								className="mb-2 text-sm font-bold"
								style={{ color: textColors.accent }}
							>
								Reimbursable Expenses
							</p>
							<table className="w-full table-fixed border-collapse">
								<colgroup>
									<col />
									<col className="w-[6.5rem]" />
									<col className="w-[7.5rem]" />
								</colgroup>
								<thead>
									<tr>
										<PreviewTableHead color={textColors.accent}>
											Description
										</PreviewTableHead>
										<PreviewTableHead
											color={textColors.accent}
											className="pl-3"
										>
											Date
										</PreviewTableHead>
										<PreviewTableHead
											color={textColors.accent}
											className="pl-3 text-right"
										>
											Amount
										</PreviewTableHead>
									</tr>
								</thead>
								<tbody>
									{data.claims.map((claim, index) => (
										<tr key={index}>
											<PreviewTableCell className="pr-3">
												{claim.description}
												{claim.hasReceipt ? (
													<span className="mt-1 block text-xs invoice-text-muted">
														Receipt attached
													</span>
												) : null}
											</PreviewTableCell>
											<PreviewTableCell className="font-number pl-3">
												{format(claim.date, "MMM d, yyyy")}
											</PreviewTableCell>
											<PreviewTableCell className="font-number pl-3 text-right">
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
							"mt-6 flex flex-col gap-6",
							data.paymentInstructions
								? "sm:flex-row sm:items-start sm:justify-between"
								: "sm:justify-end",
						)}
					>
						{data.paymentInstructions ? (
							<div className="max-w-[45%] shrink-0 sm:pr-5">
								<p
									className="mb-2 text-sm font-bold"
									style={{ color: textColors.accent }}
								>
									Payment Information
								</p>
								<p className="whitespace-pre-wrap text-sm leading-relaxed invoice-text-muted">
									{data.paymentInstructions}
								</p>
							</div>
						) : null}

						<div
							className="rounded p-3 sm:ml-auto"
							style={{ backgroundColor: secondaryColor }}
						>
							<div className="mb-2 flex w-full min-w-[16rem] sm:w-[15rem]">
								<span className="mr-4 flex-1 text-right text-sm invoice-text-muted">
									Subtotal:
								</span>
								<span className="font-number w-28 text-right text-sm">
									{formatInvoiceCurrency(data.subtotal)}
								</span>
							</div>
							{data.tax > 0 ? (
								<div className="mb-2 flex w-full min-w-[16rem] sm:w-[15rem]">
									<span className="mr-4 flex-1 text-right text-sm invoice-text-muted">
										Tax (
										{data.subtotal > 0
											? ((data.tax / data.subtotal) * 100).toFixed(1)
											: "0.0"}
										%):
									</span>
									<span className="font-number w-28 text-right text-sm">
										{formatInvoiceCurrency(data.tax)}
									</span>
								</div>
							) : null}
							{showRounding ? (
								<div className="mb-2 flex w-full min-w-[16rem] sm:w-[15rem]">
									<span className="mr-4 flex-1 whitespace-nowrap text-right text-sm invoice-text-muted">
										Rounding:
									</span>
									<span className="font-number w-28 text-right text-sm">
										{data.roundingAdjustment! > 0 ? "+" : ""}
										{formatInvoiceCurrency(data.roundingAdjustment!)}
									</span>
								</div>
							) : null}
							<div
								className="flex w-full min-w-[16rem] border-t pt-2 sm:w-[15rem]"
								style={{ borderColor: textColors.accent }}
							>
								<span
									className="mr-4 flex-1 text-right text-base font-bold"
									style={{ color: textColors.accent }}
								>
									Total:
								</span>
								<span
									className="font-number w-28 text-right text-base font-medium"
									style={{ color: textColors.accent }}
								>
									{formatInvoiceCurrency(data.total)}
								</span>
							</div>
						</div>
					</div>

					{data.notes ? (
						<div
							className="mt-8 rounded p-4"
							style={{ backgroundColor: secondaryColor }}
						>
							<p
								className="mb-2 text-sm font-bold"
								style={{ color: textColors.accent }}
							>
								Notes
							</p>
							<p className="whitespace-pre-wrap text-sm leading-relaxed">
								{data.notes}
							</p>
						</div>
					) : null}

					{data.dueDate ? (
						<p className="mt-8 text-center text-xs invoice-text-muted sm:text-sm">
							Thank you for your business! • Payment is due by{" "}
							{format(data.dueDate, "MMMM d, yyyy")}
						</p>
					) : null}
				</div>
			</div>
		</div>
	);
}
