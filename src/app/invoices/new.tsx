import { useState, useEffect, useMemo } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { usePostHog } from "@posthog/react";
import { api } from "@/../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-store-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Id } from "@/../convex/_generated/dataModel";
import { useAppData } from "@/context/app-data-provider";
import { useReceiptUpload } from "@/hooks/use-receipt-upload";
import { useInvoiceSettingsBranding } from "@/hooks/use-invoice-settings-branding";

export const Route = createFileRoute("/invoices/new")({
	component: NewInvoicePage,
});


function NewInvoicePage() {
	const navigate = useNavigate();
	const { user } = useUser();
	const { toast } = useToast();
	const posthog = usePostHog();
	useStoreUser();

	const { currentUser, clients } = useAppData();
	const settings = useQuery(
		api.settings.get,
		currentUser ? { userId: currentUser._id } : "skip"
	);
	const nextInvoiceNumber = useQuery(
		api.settings.getNextInvoiceNumber,
		currentUser ? { userId: currentUser._id } : "skip"
	);
	const createInvoice = useMutation(api.invoices.create);
	const createClient = useMutation(api.clients.create);
	const { uploadReceipt } = useReceiptUpload();
	const branding = useInvoiceSettingsBranding(currentUser?._id);

	const [selectedClientId, setSelectedClientId] = useState("");
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [issueDate, setIssueDate] = useState<Date>(new Date());
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [notes, setNotes] = useState("");
	const [lineItems, setLineItems] = useState<InvoiceFormLineItem[]>([
		{ id: "1", description: "", quantity: 1, rate: 0 },
	]);
	const [claims, setClaims] = useState<InvoiceFormClaim[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [uploadingClaimIds, setUploadingClaimIds] = useState<Set<string>>(
		new Set()
	);

	// New client modal state
	const [showNewClientModal, setShowNewClientModal] = useState(false);
	const [newClientName, setNewClientName] = useState("");
	const [newClientEmail, setNewClientEmail] = useState("");
	const [newClientStreetName, setNewClientStreetName] = useState("");
	const [newClientBuildingName, setNewClientBuildingName] = useState("");
	const [newClientUnitNumber, setNewClientUnitNumber] = useState("");
	const [newClientPostalCode, setNewClientPostalCode] = useState("");
	const [newClientContactPerson, setNewClientContactPerson] = useState("");
	const [isCreatingClient, setIsCreatingClient] = useState(false);

	const lineItemHistory = useQuery(
		api.invoices.getLineItemHistoryByClient,
		currentUser && selectedClientId
			? { userId: currentUser._id, clientId: selectedClientId as Id<"clients"> }
			: "skip",
	);

	// Auto-populate invoice number and due date from settings
	useEffect(() => {
		if (nextInvoiceNumber && !invoiceNumber) {
			setInvoiceNumber(nextInvoiceNumber);
		}
	}, [nextInvoiceNumber, invoiceNumber]);

	useEffect(() => {
		if (settings && issueDate && !dueDate) {
			const due = new Date(issueDate);
			due.setDate(due.getDate() + settings.dueDateDays);
			setDueDate(due);
		}
	}, [settings, issueDate, dueDate]);

	// Update due date when issue date changes
	useEffect(() => {
		if (settings && issueDate) {
			const due = new Date(issueDate);
			due.setDate(due.getDate() + settings.dueDateDays);
			setDueDate(due);
		}
	}, [issueDate, settings]);

	const handleCreateClient = async () => {
		if (!currentUser || !newClientName) {
			toast({
				title: "Error",
				description: "Please fill in client name",
				variant: "destructive",
			});
			return;
		}

		setIsCreatingClient(true);
		try {
			const clientId = await createClient({
				userId: currentUser._id,
				name: newClientName,
				email: newClientEmail.trim() || undefined,
				streetName: newClientStreetName.trim() || undefined,
				buildingName: newClientBuildingName.trim() || undefined,
				unitNumber: newClientUnitNumber.trim() || undefined,
				postalCode: newClientPostalCode.trim() || undefined,
				contactPerson: newClientContactPerson.trim() || undefined,
			});

			toast({
				title: "Success",
				description: "Client created successfully",
			});

			posthog.capture("client_created", {
				source: "new_invoice_modal",
			});

			setSelectedClientId(clientId);
			setShowNewClientModal(false);
			// Reset form
			setNewClientName("");
			setNewClientEmail("");
			setNewClientStreetName("");
			setNewClientBuildingName("");
			setNewClientUnitNumber("");
			setNewClientPostalCode("");
			setNewClientContactPerson("");
		} catch (error) {
			console.error("Error creating client:", error);
			toast({
				title: "Error",
				description: "Failed to create client. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsCreatingClient(false);
		}
	};

	const addLineItem = () => {
		setLineItems([
			...lineItems,
			{
				id: Date.now().toString(),
				description: "",
				quantity: 1,
				rate: 0,
			},
		]);
	};

	const removeLineItem = (id: string) => {
		if (lineItems.length > 1) {
			setLineItems(lineItems.filter((item) => item.id !== id));
		}
	};

	const updateLineItem = (
		id: string,
		field: keyof InvoiceFormLineItem,
		value: string | number,
	) => {
		setLineItems(
			lineItems.map((item) =>
				item.id === id ? { ...item, [field]: value } : item
			)
		);
	};

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

	const addClaim = () => {
		setClaims([
			...claims,
			{
				id: Date.now().toString(),
				description: "",
				amount: 0,
				date: new Date(),
			},
		]);
	};

	const removeClaim = (id: string) => {
		setClaims(claims.filter((claim) => claim.id !== id));
	};

	const updateClaim = (
		id: string,
		field: keyof InvoiceFormClaim,
		value: string | number | Date,
	) => {
		setClaims(
			claims.map((claim) =>
				claim.id === id ? { ...claim, [field]: value } : claim
			)
		);
	};

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
					description: "Image attached to this expense.",
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
		setClaims(
			claims.map((claim) =>
				claim.id === claimId ? { ...claim, imageStorageId: undefined } : claim
			)
		);
	};

	const calculateSubtotal = () => {
		return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
	};

	const calculateClaimsTotal = () => {
		return claims.reduce((sum, claim) => sum + claim.amount, 0);
	};

	const calculateTax = () => {
		const taxRate = settings?.taxRate ?? 0;
		return (calculateSubtotal() + calculateClaimsTotal()) * taxRate;
	};

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
			return;
		}

		if (lineItems.some((item) => !item.description || item.rate <= 0)) {
			alert("Please complete all line items");
			return;
		}

		setIsSubmitting(true);

		try {
			const invoiceId = await createInvoice({
				userId: currentUser._id,
				clientId: selectedClientId as Id<"clients">,
				invoiceNumber,
				issueDate: issueDate.getTime(),
				dueDate: dueDate.getTime(),
				status: "draft",
				notes: notes || undefined,
				taxRate: settings?.taxRate ?? 0,
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
			});

			posthog.capture("invoice_created", {
				invoice_number: invoiceNumber,
				line_item_count: lineItems.length,
				has_claims: claims.length > 0,
				claim_count: claims.length,
				has_notes: Boolean(notes),
				tax_rate: settings?.taxRate ?? 0,
			});

			navigate({ to: "/invoices/$id", params: { id: invoiceId } });
		} catch (error) {
			console.error("Error creating invoice:", error);
			alert("Failed to create invoice. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const taxRate = settings?.taxRate ?? 0;

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

	if (!user || !currentUser) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<InvoiceFormPage
			title="Create new invoice"
			backLink={
				<Link to="/invoices">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Invoices
					</Button>
				</Link>
			}
			actions={
				<InvoiceFormActions
					placement="header"
					onCancel={() => navigate({ to: "/invoices" })}
					submitLabel="Create invoice"
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
							onCreateNewClient={(searchValue) => {
								setNewClientName(searchValue);
								setShowNewClientModal(true);
							}}
							showCreateOption
							invoiceNumber={invoiceNumber}
							onInvoiceNumberChange={setInvoiceNumber}
							issueDate={issueDate}
							onIssueDateChange={setIssueDate}
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
							onCancel={() => navigate({ to: "/invoices" })}
							submitLabel="Create invoice"
							isSubmitting={isSubmitting}
						/>
					</>
				}
			/>

			{/* New Client Modal */}
			<Dialog
				open={showNewClientModal}
				onOpenChange={(open) => {
					setShowNewClientModal(open);
					if (!open) {
						// Reset form when closing
						setNewClientName("");
						setNewClientEmail("");
						setNewClientStreetName("");
						setNewClientBuildingName("");
						setNewClientUnitNumber("");
						setNewClientPostalCode("");
						setNewClientContactPerson("");
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New Client</DialogTitle>
						<DialogDescription>
							{newClientName
								? `Add "${newClientName}" to your client list.`
								: "Add a new client to your list. You can fill in more details later."}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="newClientName">Client Name *</Label>
							<Input
								id="newClientName"
								placeholder="Acme Corporation"
								value={newClientName}
								onChange={(e) => setNewClientName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newClientEmail">Email</Label>
							<Input
								id="newClientEmail"
								type="email"
								placeholder="contact@acme.com"
								value={newClientEmail}
								onChange={(e) => setNewClientEmail(e.target.value)}
							/>
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="newClientStreetName">Street name</Label>
								<Input
									id="newClientStreetName"
									placeholder="123 Main Street"
									value={newClientStreetName}
									onChange={(e) => setNewClientStreetName(e.target.value)}
									autoComplete="address-line1"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="newClientBuildingName">Building</Label>
								<Input
									id="newClientBuildingName"
									placeholder="Sunrise Plaza"
									value={newClientBuildingName}
									onChange={(e) => setNewClientBuildingName(e.target.value)}
									autoComplete="address-line2"
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="newClientUnitNumber">Unit</Label>
								<Input
									id="newClientUnitNumber"
									placeholder="#04-01"
									value={newClientUnitNumber}
									onChange={(e) => setNewClientUnitNumber(e.target.value)}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="newClientPostalCode">Postal code</Label>
								<Input
									id="newClientPostalCode"
									placeholder="123456"
									value={newClientPostalCode}
									onChange={(e) => setNewClientPostalCode(e.target.value)}
									autoComplete="postal-code"
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newClientContactPerson">
								Contact Person (Optional)
							</Label>
							<Input
								id="newClientContactPerson"
								placeholder="John Doe"
								value={newClientContactPerson}
								onChange={(e) => setNewClientContactPerson(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setShowNewClientModal(false)}
							disabled={isCreatingClient}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={handleCreateClient}
							disabled={isCreatingClient || !newClientName || !newClientEmail}
						>
							{isCreatingClient ? "Creating..." : "Create Client"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</InvoiceFormPage>
	);
}

