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

// Register fonts (optional - using built-in fonts for now)
// Font.register({
//   family: 'Roboto',
//   src: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf',
// });

// Define styles
const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 11,
		fontFamily: "Helvetica",
	},
	header: {
		marginBottom: 30,
		flexDirection: "row",
		justifyContent: "space-between",
	},
	title: {
		fontSize: 28,
		fontFamily: "Helvetica-Bold",
		marginBottom: 10,
	},
	invoiceNumber: {
		fontSize: 12,
		color: "#666",
		marginBottom: 4,
	},
	section: {
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 12,
		fontFamily: "Helvetica-Bold",
		marginBottom: 8,
		color: "#333",
	},
	row: {
		flexDirection: "row",
		marginBottom: 4,
	},
	label: {
		width: 100,
		fontFamily: "Helvetica-Bold",
		color: "#666",
	},
	value: {
		flex: 1,
	},
	table: {
		marginTop: 20,
		marginBottom: 20,
	},
	tableHeader: {
		flexDirection: "row",
		borderBottomWidth: 2,
		borderBottomColor: "#333",
		paddingBottom: 8,
		marginBottom: 8,
	},
	tableHeaderCell: {
		fontFamily: "Helvetica-Bold",
		fontSize: 10,
		textTransform: "uppercase",
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
	},
	rateCell: {
		flex: 1,
		textAlign: "right",
	},
	amountCell: {
		flex: 1,
		textAlign: "right",
	},
	totals: {
		marginTop: 20,
		alignItems: "flex-end",
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
	totalValue: {
		width: 80,
		textAlign: "right",
	},
	grandTotal: {
		fontSize: 14,
		fontFamily: "Helvetica-Bold",
		paddingTop: 8,
		borderTopWidth: 2,
		borderTopColor: "#333",
	},
	notes: {
		marginTop: 30,
		padding: 15,
		backgroundColor: "#f9f9f9",
		borderRadius: 4,
	},
	notesTitle: {
		fontFamily: "Helvetica-Bold",
		marginBottom: 8,
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
	status: {
		position: "absolute",
		top: 40,
		right: 40,
		padding: 8,
		borderRadius: 4,
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
		textTransform: "uppercase",
	},
	statusDraft: {
		backgroundColor: "#f3f4f6",
		color: "#6b7280",
	},
	statusSent: {
		backgroundColor: "#dbeafe",
		color: "#1d4ed8",
	},
	statusPaid: {
		backgroundColor: "#d1fae5",
		color: "#065f46",
	},
	statusOverdue: {
		backgroundColor: "#fee2e2",
		color: "#991b1b",
	},
	receiptImage: {
		marginTop: 8,
		marginBottom: 8,
		maxWidth: 200,
		maxHeight: 150,
		objectFit: "contain",
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
		fontFamily: "Helvetica",
		justifyContent: "space-between",
	},
	receiptPageHeader: {
		marginBottom: 20,
	},
	receiptPageTitle: {
		fontSize: 20,
		fontFamily: "Helvetica-Bold",
		marginBottom: 4,
	},
	receiptPageMeta: {
		fontSize: 10,
		color: "#555",
		marginBottom: 4,
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

type InvoiceData = {
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
	total: number;
	notes?: string;
};

export const InvoicePDF = ({ invoice }: { invoice: InvoiceData }) => {
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

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				{/* Header */}
				<View style={styles.header}>
					<View>
						<Text style={styles.title}>INVOICE</Text>
						<Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
					</View>
				</View>

				{/* Invoice Details */}
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

				{/* Bill To */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Bill To:</Text>
					<Text style={{ marginBottom: 4, fontFamily: "Helvetica-Bold" }}>
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

				{/* Line Items Table */}
				<View style={styles.table}>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableHeaderCell, styles.descriptionCell]}>
							Description
						</Text>
						<Text style={[styles.tableHeaderCell, styles.quantityCell]}>
							Qty
						</Text>
						<Text style={[styles.tableHeaderCell, styles.rateCell]}>Rate</Text>
						<Text style={[styles.tableHeaderCell, styles.amountCell]}>
							Amount
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

				{/* Claims/Expenses Table */}
				{claims.length > 0 && (
					<View style={styles.table}>
						<Text style={styles.sectionTitle}>Reimbursable Expenses</Text>
						<View style={styles.tableHeader}>
							<Text style={[styles.tableHeaderCell, { flex: 2 }]}>
								Description
							</Text>
							<Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
							<Text
								style={[
									styles.tableHeaderCell,
									{ flex: 1, textAlign: "right" },
								]}
							>
								Amount
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
									<Text style={[styles.tableCell, { flex: 1 }]}>
										{claim.date}
									</Text>
									<Text
										style={[styles.tableCell, { flex: 1, textAlign: "right" }]}
									>
										${claim.amount.toFixed(2)}
									</Text>
								</View>
							);
						})}
					</View>
				)}

				{/* Totals */}
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
					<View style={[styles.totalRow, styles.grandTotal]}>
						<Text style={styles.totalLabel}>Total:</Text>
						<Text style={styles.totalValue}>${invoice.total.toFixed(2)}</Text>
					</View>
				</View>

				{/* Notes */}
				{invoice.notes && (
					<View style={styles.notes}>
						<Text style={styles.notesTitle}>Notes</Text>
						<Text style={styles.notesText}>{invoice.notes}</Text>
					</View>
				)}

				{/* Footer */}
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
