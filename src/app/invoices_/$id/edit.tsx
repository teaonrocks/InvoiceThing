import { useState, useEffect, useMemo } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { usePostHog } from "@posthog/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
	InvoiceFormPage,
	InvoiceEditorLayout,
	InvoiceDetailsFields,
	InvoiceFormActions,
	InvoiceLineItemsEditor,
	InvoiceClaimsEditor,
	InvoiceNotesSection,
	type InvoiceFormLineItem,
	type InvoiceFormClaim,
} from "@/components/invoice-form-ui";
import {
	InvoiceEditorPreview,
	buildInvoiceEditorPreviewData,
} from "@/components/invoice-editor-preview";
import { ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useUser } from "@clerk/clerk-react";
import { useStoreUser } from "@/hooks/use-store-user";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/app-data-provider";
import { useReceiptUpload } from "@/hooks/use-receipt-upload";
import { useInvoiceSettingsBranding } from "@/hooks/use-invoice-settings-branding";

export const Route = createFileRoute("/invoices_/$id/edit")({
	component: EditInvoicePage,
});

function EditInvoicePage() {
	const navigate = useNavigate();
	const { id } = Route.useParams();
	const { user } = useUser();
	useStoreUser();
	const { toast } = useToast();
	const posthog = usePostHog();

	const invoice = useQuery(api.invoices.get, {
		invoiceId: id as Id<"invoices">,
	})
	const { currentUser, clients } = useAppData();
	const settings = useQuery(
		api.settings.get,
		currentUser ? { userId: currentUser._id } : "skip"
	)

	// Update mutation
	const updateInvoice = useMutation(api.invoices.update);
	const { uploadReceipt } = useReceiptUpload();
	const branding = useInvoiceSettingsBranding(currentUser?._id);

	const [selectedClientId, setSelectedClientId] = useState("");
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [issueDate, setIssueDate] = useState<Date | undefined>();
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [notes, setNotes] = useState("");
	const [lineItems, setLineItems] = useState<InvoiceFormLineItem[]>([
		{ id: "1", description: "", quantity: 1, rate: 0 },
	]);
	const [claims, setClaims] = useState<InvoiceFormClaim[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [uploadingClaimIds, setUploadingClaimIds] = useState<Set<string>>(
		new Set()
	);

	const lineItemHistory = useQuery(
		api.invoices.getLineItemHistoryByClient,
		currentUser && selectedClientId
			? { userId: currentUser._id, clientId: selectedClientId as Id<"clients"> }
			: "skip",
	);

	// Load invoice data when available
	useEffect(() => {
		if (invoice && clients && !isLoaded) {
			setSelectedClientId(invoice.clientId);
			setInvoiceNumber(invoice.invoiceNumber);
			setIssueDate(new Date(invoice.issueDate));
			setDueDate(new Date(invoice.dueDate));
			setNotes(invoice.notes || "");

			if (invoice.lineItems && invoice.lineItems.length > 0) {
				setLineItems(
					invoice.lineItems.map((item, index) => ({
						id: item._id || `item-${index}`,
						description: item.description,
						quantity: item.quantity,
						rate: item.unitPrice,
					}))
				)
			}

			setClaims(
				(invoice.claims ?? []).map((claim, index) => ({
					id: claim._id || `claim-${index}`,
					description: claim.description,
					amount: claim.amount,
					date: new Date(claim.date),
					imageStorageId: claim.imageStorageId ?? undefined,
				}))
			)

			setIsLoaded(true);
		}
	}, [invoice, clients, isLoaded]);

	const addLineItem = () => {
		setLineItems([
			...lineItems,
			{
				id: Date.now().toString(),
				description: "",
				quantity: 1,
				rate: 0,
			},
		])
	}

	const removeLineItem = (id: string) => {
		if (lineItems.length > 1) {
			setLineItems(lineItems.filter((item) => item.id !== id));
		}
	}

	const updateLineItem = (
		id: string,
		field: keyof InvoiceFormLineItem,
		value: string | number,
	) => {
		setLineItems(
			lineItems.map((item) =>
				item.id === id ? { ...item, [field]: value } : item
			)
		)
	}

	const selectLineItemSuggestion = (
		id: string,
		description: string,
		rate: number,
	) => {
		setLineItems(
			lineItems.map((item) =>
				item.id === id ? { ...item, description, rate } : item
			),
		);
	};

	const lineItemSuggestions = useMemo(
		() =>
			lineItemHistory?.map((item) => ({
				description: item.description,
				unitPrice: item.unitPrice,
			})) ?? [],
		[lineItemHistory],
	);

	const calculateSubtotal = () => {
		return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
	}

	const addClaim = () => {
		setClaims((current) => [
			...current,
			{
				id: Date.now().toString(),
				description: "",
				amount: 0,
				date: new Date(),
			},
		])
	}

	const removeClaim = (claimId: string) => {
		setClaims((current) => current.filter((claim) => claim.id !== claimId));
	}

	const updateClaim = (
		claimId: string,
		field: keyof InvoiceFormClaim,
		value: string | number | Date,
	) => {
		setClaims((current) =>
			current.map((claim) =>
				claim.id === claimId
					? {
							...claim,
							[field]: value,
						}
					: claim
			)
		)
	}

	const handleClaimImageUpload = async (claimId: string, file: File) => {
		setUploadingClaimIds((prev) => new Set(prev).add(claimId));
		try {
			const storageId = await uploadReceipt(file);
			if (storageId) {
				setClaims((current) =>
					current.map((claim) =>
						claim.id === claimId
							? { ...claim, imageStorageId: storageId }
							: claim,
					),
				);
				toast({
					title: "Receipt uploaded",
					description: "The receipt image has been attached.",
				});
			}
		} finally {
			setUploadingClaimIds((prev) => {
				const next = new Set(prev);
				next.delete(claimId);
				return next;
			});
		}
	};

	const removeClaimImage = (claimId: string) => {
		setClaims((current) =>
			current.map((claim) =>
				claim.id === claimId ? { ...claim, imageStorageId: undefined } : claim
			)
		)
	}

	const calculateClaimsTotal = () => {
		return claims.reduce((sum, claim) => sum + (claim.amount || 0), 0);
	}

	const getTaxRate = () => {
		if (settings?.taxRate !== undefined) {
			return settings.taxRate;
		}
		if (invoice?.subtotal) {
			const inferred = invoice.tax / invoice.subtotal;
			return Number.isFinite(inferred) ? inferred : 0;
		}
		return 0;
	}

	const calculateTax = () => {
		const taxRate = getTaxRate();
		return (calculateSubtotal() + calculateClaimsTotal()) * taxRate;
	}

	const taxRate = getTaxRate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (
			!currentUser ||
			!selectedClientId ||
			!invoiceNumber ||
			!issueDate ||
			!dueDate
		) {
			alert("Please fill in all required fields");
			return
		}

		if (lineItems.some((item) => !item.description || item.rate <= 0)) {
			alert("Please complete all line items");
			return
		}

		setIsSubmitting(true);

		try {
			await updateInvoice({
				invoiceId: id as Id<"invoices">,
				userId: currentUser._id,
				clientId: selectedClientId as Id<"clients">,
				invoiceNumber,
				issueDate: issueDate.getTime(),
				dueDate: dueDate.getTime(),
				notes: notes || undefined,
				taxRate: getTaxRate(),
				lineItems: lineItems.map((item) => ({
					description: item.description,
					quantity: item.quantity,
					unitPrice: item.rate,
				})),
				claims:
					claims.length > 0
						? claims.map((claim) => ({
								description: claim.description,
								amount: claim.amount,
								date: claim.date.getTime(),
								imageStorageId: claim.imageStorageId,
							}))
						: undefined,
			})

			posthog.capture("invoice_updated", {
				invoice_id: id,
				invoice_number: invoiceNumber,
				line_item_count: lineItems.length,
				has_claims: claims.length > 0,
				claim_count: claims.length,
				has_notes: Boolean(notes),
			});

			navigate({ to: "/invoices/$id", params: { id } });
		} catch (error) {
			console.error("Error updating invoice:", error);
			alert("Failed to update invoice. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	const previewData = useMemo(
		() =>
			buildInvoiceEditorPreviewData({
				invoiceNumber,
				issueDate,
				dueDate,
				selectedClientId,
				clients,
				lineItems,
				claims,
				notes,
				subtotal: calculateSubtotal(),
				expensesTotal: calculateClaimsTotal(),
				tax: calculateTax(),
				taxRate,
				paymentInstructions: settings?.paymentInstructions,
				enableRounding: settings?.enableRounding,
				roundingIncrement: settings?.roundingIncrement,
				branding,
			}),
		[
			invoiceNumber,
			issueDate,
			dueDate,
			selectedClientId,
			clients,
			lineItems,
			claims,
			notes,
			settings?.paymentInstructions,
			settings?.enableRounding,
			settings?.roundingIncrement,
			taxRate,
			branding,
		],
	);

	if (!user || !currentUser || !invoice) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Spinner className="h-8 w-8 text-muted-foreground" />
			</div>
		);
	}

	return (
		<InvoiceFormPage
			title="Edit invoice"
			backLink={
				<Link to="/invoices/$id" params={{ id }}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Invoice
					</Button>
				</Link>
			}
			actions={
				<InvoiceFormActions
					placement="header"
					onCancel={() => navigate({ to: "/invoices/$id", params: { id } })}
					submitLabel="Update invoice"
					isSubmitting={isSubmitting}
				/>
			}
		>
			<InvoiceEditorLayout
				onSubmit={handleSubmit}
				preview={<InvoiceEditorPreview data={previewData} />}
				controls={
					<>
						<InvoiceDetailsFields
							clients={clients}
							selectedClientId={selectedClientId}
							onClientSelect={setSelectedClientId}
							invoiceNumber={invoiceNumber}
							onInvoiceNumberChange={setInvoiceNumber}
							issueDate={issueDate}
							onIssueDateChange={(date) => setIssueDate(date)}
							dueDate={dueDate}
							onDueDateChange={setDueDate}
						/>
						<InvoiceLineItemsEditor
							lineItems={lineItems}
							onAdd={addLineItem}
							onRemove={removeLineItem}
							onUpdate={updateLineItem}
							onSelectSuggestion={selectLineItemSuggestion}
							lineItemSuggestions={lineItemSuggestions}
							clientSelected={Boolean(selectedClientId)}
						/>
						<InvoiceClaimsEditor
							claims={claims}
							uploadingClaimIds={uploadingClaimIds}
							onAdd={addClaim}
							onRemove={removeClaim}
							onUpdate={updateClaim}
							onImageUpload={handleClaimImageUpload}
							onImageRemove={removeClaimImage}
						/>
						<InvoiceNotesSection notes={notes} onNotesChange={setNotes} />
						<InvoiceFormActions
							placement="mobile"
							onCancel={() =>
								navigate({ to: "/invoices/$id", params: { id } })
							}
							submitLabel="Update invoice"
							isSubmitting={isSubmitting}
						/>
					</>
				}
			/>
		</InvoiceFormPage>
	);
}

