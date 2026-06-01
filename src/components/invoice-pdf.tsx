"use client";

import {
	Document,
	Page,
	Text,
	View,
	StyleSheet,
	Image,
} from "@react-pdf/renderer";
import { formatAddressParts } from "@/lib/utils";
import {
	buildInvoiceBranding,
	type InvoiceBranding,
	getInvoiceTextColors,
	INVOICE_LOGO_HEIGHT,
	INVOICE_LOGO_MAX_WIDTH,
} from "@/lib/invoice-branding";
import { ensureInvoicePdfFont } from "@/lib/register-invoice-pdf-fonts";

function createInvoicePdfStyles(branding: InvoiceBranding) {
	const font = ensureInvoicePdfFont(branding.fontKey);
	const accent = branding.accentColor;
	const secondary = branding.secondaryColor;
	const textColors = getInvoiceTextColors(accent, secondary);
	const heading = { fontFamily: font.pdfFamily, fontWeight: 700 as const };
	const body = { fontFamily: font.pdfFamily };
	const mono = { fontFamily: "DM Mono" };

	return StyleSheet.create({
		page: {
			padding: 40,
			paddingBottom: 56,
			fontSize: 11,
			...body,
			backgroundColor: secondary,
			color: textColors.foreground,
			justifyContent: "flex-start",
		},
		header: {
			position: "relative",
			marginBottom: 30,
		},
		headerTitle: {
			paddingRight: INVOICE_LOGO_MAX_WIDTH + 16,
		},
		logo: {
			position: "absolute",
			top: 0,
			right: 0,
			height: INVOICE_LOGO_HEIGHT,
			maxWidth: INVOICE_LOGO_MAX_WIDTH,
			objectFit: "contain",
		},
		title: {
			fontSize: 28,
			...heading,
			marginBottom: 10,
			color: textColors.accent,
		},
		invoiceNumber: {
			fontSize: 12,
			color: textColors.mutedForeground,
			marginBottom: 4,
			...mono,
		},
		section: {
			marginBottom: 20,
		},
		sectionTitle: {
			fontSize: 12,
			...heading,
			marginBottom: 8,
			color: textColors.accent,
		},
		row: {
			flexDirection: "row",
			marginBottom: 4,
		},
		label: {
			width: 100,
			...body,
			fontWeight: 700,
			color: textColors.mutedForeground,
		},
		value: {
			flex: 1,
			...mono,
		},
		table: {
			marginTop: 20,
			marginBottom: 20,
		},
		tableHeader: {
			flexDirection: "row",
			borderBottomWidth: 2,
			borderBottomColor: textColors.accent,
			paddingBottom: 8,
			marginBottom: 8,
		},
		tableHeaderCell: {
			...heading,
			fontSize: 10,
			textTransform: "uppercase",
			color: textColors.accent,
		},
		tableRow: {
			flexDirection: "row",
			paddingVertical: 6,
			borderBottomWidth: 1,
			borderBottomColor: textColors.border,
		},
		tableCell: {
			fontSize: 10,
		},
		descriptionCell: {
			flex: 3,
		},
		quantityCell: {
			flex: 1,
			textAlign: "right",
			...mono,
		},
		rateCell: {
			flex: 1,
			textAlign: "right",
			...mono,
		},
		amountCell: {
			flex: 1,
			textAlign: "right",
			...mono,
		},
		totalsContainer: {
			marginTop: 20,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "flex-start",
		},
		totalsOnlyContainer: {
			marginTop: 20,
			flexDirection: "row",
			justifyContent: "flex-end",
			alignItems: "flex-start",
		},
		summarySection: {
			flexGrow: 0,
			flexShrink: 0,
		},
		summarySide: {
			flex: 1,
			maxWidth: "45%",
			paddingRight: 20,
			flexDirection: "column",
			alignItems: "flex-start",
		},
		totals: {
			alignItems: "flex-end",
			backgroundColor: secondary,
			padding: 10,
			borderRadius: 4,
		},
		totalRow: {
			flexDirection: "row",
			marginBottom: 6,
			width: 200,
		},
		totalLabel: {
			flex: 1,
			textAlign: "right",
			marginRight: 20,
		},
		totalLabelNoWrap: {
			flex: 1,
			textAlign: "right",
			marginRight: 20,
			whiteSpace: "nowrap",
		},
		totalValue: {
			width: 80,
			textAlign: "right",
			...mono,
		},
		grandTotal: {
			fontSize: 14,
			...mono,
			fontWeight: 500,
			paddingTop: 8,
			borderTopWidth: 2,
			borderTopColor: textColors.accent,
		},
		grandTotalLabel: {
			color: textColors.accent,
			fontWeight: 700,
		},
		grandTotalValue: {
			color: textColors.accent,
		},
		paymentInfo: {
			flexGrow: 0,
			flexShrink: 0,
		},
		paymentTitle: {
			...heading,
			marginBottom: 8,
			fontSize: 11,
			color: textColors.accent,
		},
		paymentText: {
			fontSize: 9,
			whiteSpace: "pre-wrap",
			color: textColors.mutedForeground,
		},
		notes: {
			marginTop: 16,
			flexGrow: 0,
			flexShrink: 0,
			alignSelf: "stretch",
		},
		notesPanel: {
			marginTop: 16,
			padding: 15,
			backgroundColor: secondary,
			borderRadius: 4,
			flexGrow: 0,
			flexShrink: 0,
		},
		notesTitle: {
			...heading,
			marginBottom: 8,
			fontSize: 11,
			color: textColors.accent,
		},
		notesText: {
			fontSize: 10,
			whiteSpace: "pre-wrap",
		},
		footer: {
			position: "absolute",
			bottom: 40,
			left: 40,
			right: 40,
			textAlign: "center",
			fontSize: 9,
			color: textColors.mutedForeground,
		},
		receiptLabel: {
			fontSize: 8,
			color: textColors.mutedForeground,
			marginTop: 4,
		},
		receiptPage: {
			padding: 40,
			fontSize: 11,
			...body,
			backgroundColor: secondary,
		},
		receiptPageHeader: {
			marginBottom: 20,
		},
		receiptPageTitle: {
			fontSize: 20,
			...heading,
			marginBottom: 4,
			color: textColors.accent,
		},
		receiptPageMeta: {
			fontSize: 10,
			color: textColors.mutedForeground,
			marginBottom: 4,
			...mono,
		},
		receiptImageFull: {
			width: 515,
			maxHeight: 680,
			objectFit: "contain",
		},
		receiptImageWrapper: {
			marginTop: 12,
			borderWidth: 1,
			borderColor: textColors.border,
			padding: 12,
			alignItems: "center",
		},
	});
}

export type InvoicePdfData = {
	invoiceNumber: string;
	issueDate: string;
	dueDate: string;
	client: {
		name: string;
		email?: string;
		contactPerson?: string;
		streetName?: string;
		buildingName?: string;
		unitNumber?: string;
		postalCode?: string;
	};
	lineItems: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
		total: number;
	}>;
	claims?: Array<{
		description: string;
		amount: number;
		date: string;
		imageUrl?: string;
	}>;
	subtotal: number;
	tax: number;
	roundingAdjustment?: number;
	total: number;
	notes?: string;
	paymentInstructions?: string;
	branding?: InvoiceBranding;
};

export const InvoicePDF = ({ invoice }: { invoice: InvoicePdfData }) => {
	const branding = invoice.branding ?? buildInvoiceBranding();
	const textColors = getInvoiceTextColors(
		branding.accentColor,
		branding.secondaryColor,
	);
	const styles = createInvoicePdfStyles(branding);
	const claims = invoice.claims ?? [];
	const claimsWithImages = claims.filter((claim) => Boolean(claim.imageUrl));
	const receiptPageMap = new Map<(typeof claims)[number], number>();
	claimsWithImages.forEach((claim, index) => {
		receiptPageMap.set(claim, index + 2);
	});

	const formattedClientAddress = formatAddressParts({
		streetName: invoice.client.streetName,
		buildingName: invoice.client.buildingName,
		unitNumber: invoice.client.unitNumber,
		postalCode: invoice.client.postalCode,
	});

	const heading = {
		fontFamily: branding.fontFamily,
		fontWeight: 700 as const,
	};

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					{branding.logoUrl ? (
						// eslint-disable-next-line jsx-a11y/alt-text
						<Image src={branding.logoUrl} style={styles.logo} />
					) : null}
					<View style={branding.logoUrl ? styles.headerTitle : undefined}>
						<Text style={styles.title}>INVOICE</Text>
						<Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
					</View>
				</View>

				<View style={styles.section}>
					<View style={styles.row}>
						<Text style={styles.label}>Issue Date:</Text>
						<Text style={styles.value}>{invoice.issueDate}</Text>
					</View>
					<View style={styles.row}>
						<Text style={styles.label}>Due Date:</Text>
						<Text style={styles.value}>{invoice.dueDate}</Text>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Bill To:</Text>
					<Text style={{ marginBottom: 4, ...heading }}>
						{invoice.client.name}
					</Text>
					{invoice.client.contactPerson && (
						<Text style={{ marginBottom: 4, fontSize: 10 }}>
							Attn: {invoice.client.contactPerson}
						</Text>
					)}
					{invoice.client.email && (
						<Text style={{ marginBottom: 4, fontSize: 10 }}>
							{invoice.client.email}
						</Text>
					)}
					{formattedClientAddress && (
						<Text style={{ fontSize: 10, color: textColors.mutedForeground }}>
							{formattedClientAddress}
						</Text>
					)}
				</View>

				<View style={styles.table}>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableHeaderCell, styles.descriptionCell]}>
							DESCRIPTION
						</Text>
						<Text style={[styles.tableHeaderCell, styles.quantityCell]}>
							QTY
						</Text>
						<Text style={[styles.tableHeaderCell, styles.rateCell]}>RATE</Text>
						<Text style={[styles.tableHeaderCell, styles.amountCell]}>
							AMOUNT
						</Text>
					</View>

					{invoice.lineItems.map((item, index) => (
						<View key={index} style={styles.tableRow}>
							<Text style={[styles.tableCell, styles.descriptionCell]}>
								{item.description}
							</Text>
							<Text style={[styles.tableCell, styles.quantityCell]}>
								{item.quantity}
							</Text>
							<Text style={[styles.tableCell, styles.rateCell]}>
								${item.unitPrice.toFixed(2)}
							</Text>
							<Text style={[styles.tableCell, styles.amountCell]}>
								${item.total.toFixed(2)}
							</Text>
						</View>
					))}
				</View>

				{claims.length > 0 && (
					<View style={styles.table}>
						<Text style={styles.sectionTitle}>Reimbursable Expenses</Text>
						<View style={styles.tableHeader}>
							<Text style={[styles.tableHeaderCell, { flex: 2 }]}>
								DESCRIPTION
							</Text>
							<Text style={[styles.tableHeaderCell, { flex: 1 }]}>DATE</Text>
							<Text
								style={[
									styles.tableHeaderCell,
									{ flex: 1, textAlign: "right" },
								]}
							>
								AMOUNT
							</Text>
						</View>

						{claims.map((claim, index) => {
							const receiptPageNumber = receiptPageMap.get(claim);
							return (
								<View key={index} style={styles.tableRow}>
									<View style={{ flex: 2 }}>
										<Text style={styles.tableCell}>{claim.description}</Text>
										{claim.imageUrl && (
											<Text style={styles.receiptLabel}>
												Receipt attached
												{receiptPageNumber
													? ` (see page ${receiptPageNumber})`
													: ""}
											</Text>
										)}
									</View>
									<Text
										style={[
											styles.tableCell,
											{ flex: 1, fontFamily: "DM Mono" },
										]}
									>
										{claim.date}
									</Text>
									<Text
										style={[
											styles.tableCell,
											{ flex: 1, textAlign: "right", fontFamily: "DM Mono" },
										]}
									>
										${claim.amount.toFixed(2)}
									</Text>
								</View>
							);
						})}
					</View>
				)}

				<View style={styles.summarySection} wrap={false}>
					<View
						style={
							invoice.paymentInstructions
								? styles.totalsContainer
								: styles.totalsOnlyContainer
						}
						wrap={false}
					>
						{invoice.paymentInstructions && (
							<View style={styles.summarySide} wrap={false}>
								<View style={styles.paymentInfo} wrap={false}>
									<Text style={styles.paymentTitle}>
										Payment Information
									</Text>
									<Text style={styles.paymentText} wrap={false}>
										{invoice.paymentInstructions}
									</Text>
								</View>
								{invoice.notes && (
									<View style={styles.notes} wrap={false}>
										<Text style={styles.notesTitle}>Notes</Text>
										<Text style={styles.notesText} wrap={false}>
											{invoice.notes}
										</Text>
									</View>
								)}
							</View>
						)}

						<View style={styles.totals} wrap={false}>
							<View style={styles.totalRow}>
								<Text style={styles.totalLabel}>Subtotal:</Text>
								<Text style={styles.totalValue}>
									${invoice.subtotal.toFixed(2)}
								</Text>
							</View>
							{invoice.tax > 0 && (
								<View style={styles.totalRow}>
									<Text style={styles.totalLabel}>
										Tax (
										{((invoice.tax / invoice.subtotal) * 100).toFixed(1)}%):
									</Text>
									<Text style={styles.totalValue}>
										${invoice.tax.toFixed(2)}
									</Text>
								</View>
							)}
							{invoice.roundingAdjustment &&
								Math.abs(invoice.roundingAdjustment) >= 0.001 && (
									<View style={styles.totalRow}>
										<Text style={styles.totalLabelNoWrap}>Rounding:</Text>
										<Text style={styles.totalValue}>
											{invoice.roundingAdjustment > 0 ? "+" : ""}$
											{invoice.roundingAdjustment.toFixed(2)}
										</Text>
									</View>
								)}
							<View style={[styles.totalRow, styles.grandTotal]}>
								<Text style={[styles.totalLabel, styles.grandTotalLabel]}>
									Total:
								</Text>
								<Text style={[styles.totalValue, styles.grandTotalValue]}>
									${invoice.total.toFixed(2)}
								</Text>
							</View>
						</View>
					</View>

					{invoice.notes && !invoice.paymentInstructions && (
						<View style={styles.notesPanel} wrap={false}>
							<Text style={styles.notesTitle}>Notes</Text>
							<Text style={styles.notesText} wrap={false}>
								{invoice.notes}
							</Text>
						</View>
					)}
				</View>

				<Text style={styles.footer} wrap={false}>
					Thank you for your business! • Payment is due by {invoice.dueDate}
				</Text>
			</Page>
			{claimsWithImages.map((claim, index) => (
				<Page key={`receipt-${index}`} size="A4" style={styles.receiptPage}>
					<View style={styles.receiptPageHeader}>
						<Text style={styles.receiptPageTitle}>Receipt {index + 1}</Text>
						<Text style={styles.receiptPageMeta}>
							Description: {claim.description}
						</Text>
						<Text style={styles.receiptPageMeta}>
							Amount: ${claim.amount.toFixed(2)}
						</Text>
						<Text style={styles.receiptPageMeta}>Date: {claim.date}</Text>
					</View>
					<View style={styles.receiptImageWrapper}>
						{claim.imageUrl ? (
							// eslint-disable-next-line jsx-a11y/alt-text
							<Image src={claim.imageUrl} style={styles.receiptImageFull} />
						) : (
							<Text style={styles.receiptLabel}>Receipt image unavailable</Text>
						)}
					</View>
				</Page>
			))}
		</Document>
	);
};
