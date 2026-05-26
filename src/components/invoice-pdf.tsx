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
} from "@/lib/invoice-branding";
import { ensureInvoicePdfFont } from "@/lib/register-invoice-pdf-fonts";

function createInvoicePdfStyles(branding: InvoiceBranding) {
	const font = ensureInvoicePdfFont(branding.fontKey);
	const accent = branding.accentColor;
	const secondary = branding.secondaryColor;
	const heading = { fontFamily: font.pdfFamily, fontWeight: 700 as const };
	const body = { fontFamily: font.pdfFamily };
	const mono = { fontFamily: "DM Mono" };

	return StyleSheet.create({
		page: {
			padding: 40,
			fontSize: 11,
			...body,
			backgroundColor: secondary,
		},
		header: {
			marginBottom: 30,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "flex-start",
		},
		logo: {
			maxWidth: 120,
			maxHeight: 48,
			objectFit: "contain",
		},
		title: {
			fontSize: 28,
			...heading,
			marginBottom: 10,
			color: accent,
		},
		invoiceNumber: {
			fontSize: 12,
			color: "#666",
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
			color: accent,
		},
		row: {
			flexDirection: "row",
			marginBottom: 4,
		},
		label: {
			width: 100,
			...body,
			fontWeight: 700,
			color: "#666",
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
			borderBottomColor: accent,
			paddingBottom: 8,
			marginBottom: 8,
		},
		tableHeaderCell: {
			...heading,
			fontSize: 10,
			textTransform: "uppercase",
			color: accent,
		},
		tableRow: {
			flexDirection: "row",
			paddingVertical: 6,
			borderBottomWidth: 1,
			borderBottomColor: "#eee",
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
			borderTopColor: accent,
		},
		grandTotalLabel: {
			color: accent,
			fontWeight: 700,
		},
		grandTotalValue: {
			color: accent,
		},
		paymentInfo: {
			flex: 1,
			maxWidth: "45%",
			paddingRight: 20,
		},
		paymentTitle: {
			...heading,
			marginBottom: 8,
			fontSize: 11,
			color: accent,
		},
		paymentText: {
			fontSize: 9,
			lineHeight: 1.5,
			whiteSpace: "pre-wrap",
			color: "#333",
		},
		notes: {
			marginTop: 30,
			padding: 15,
			backgroundColor: secondary,
			borderRadius: 4,
		},
		notesTitle: {
			...heading,
			marginBottom: 8,
			color: accent,
		},
		notesText: {
			fontSize: 10,
			lineHeight: 1.5,
		},
		footer: {
			position: "absolute",
			bottom: 40,
			left: 40,
			right: 40,
			textAlign: "center",
			fontSize: 9,
			color: "#999",
		},
		receiptLabel: {
			fontSize: 8,
			color: "#666",
			marginTop: 4,
			fontStyle: "italic",
		},
		receiptPage: {
			padding: 40,
			fontSize: 11,
			...body,
			justifyContent: "space-between",
		},
		receiptPageHeader: {
			marginBottom: 20,
		},
		receiptPageTitle: {
			fontSize: 20,
			...heading,
			marginBottom: 4,
			color: accent,
		},
		receiptPageMeta: {
			fontSize: 10,
			color: "#555",
			marginBottom: 4,
			...mono,
		},
		receiptImageFull: {
			flexGrow: 1,
			objectFit: "contain",
		},
		receiptImageWrapper: {
			flexGrow: 1,
			borderWidth: 1,
			borderColor: "#ddd",
			borderStyle: "dashed",
			padding: 12,
			alignItems: "center",
			justifyContent: "center",
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
					<View>
						<Text style={styles.title}>INVOICE</Text>
						<Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
					</View>
					{branding.logoUrl ? (
						// eslint-disable-next-line jsx-a11y/alt-text
						<Image src={branding.logoUrl} style={styles.logo} />
					) : null}
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
						<Text style={{ fontSize: 10, color: "#666" }}>
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

				<View
					style={
						invoice.paymentInstructions
							? styles.totalsContainer
							: { marginTop: 20, alignItems: "flex-end" }
					}
				>
					{invoice.paymentInstructions && (
						<View style={styles.paymentInfo}>
							<Text style={styles.paymentTitle}>Payment Information</Text>
							<Text style={styles.paymentText}>
								{invoice.paymentInstructions}
							</Text>
						</View>
					)}

					<View style={styles.totals}>
						<View style={styles.totalRow}>
							<Text style={styles.totalLabel}>Subtotal:</Text>
							<Text style={styles.totalValue}>
								${invoice.subtotal.toFixed(2)}
							</Text>
						</View>
						{invoice.tax > 0 && (
							<View style={styles.totalRow}>
								<Text style={styles.totalLabel}>
									Tax ({((invoice.tax / invoice.subtotal) * 100).toFixed(1)}%):
								</Text>
								<Text style={styles.totalValue}>${invoice.tax.toFixed(2)}</Text>
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

				{invoice.notes && (
					<View style={styles.notes}>
						<Text style={styles.notesTitle}>Notes</Text>
						<Text style={styles.notesText}>{invoice.notes}</Text>
					</View>
				)}

				<Text style={styles.footer}>
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
