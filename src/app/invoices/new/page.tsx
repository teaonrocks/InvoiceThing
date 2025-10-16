"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-store-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ClientSelector } from "@/components/client-selector";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Plus,
	Trash2,
	ArrowLeft,
	CalendarIcon,
	Upload,
	X,
	Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Link from "next/link";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useAppData } from "@/context/app-data-provider";

type LineItem = {
	id: string;
	description: string;
	quantity: number;
	rate: number;
};

type Claim = {
	id: string;
	description: string;
	amount: number;
	date: Date;
	imageStorageId?: Id<"_storage">;
	imageUrl?: string;
};

export default function NewInvoicePage() {
	const router = useRouter();
	const { user } = useUser();
	const { toast } = useToast();
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
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	const [selectedClientId, setSelectedClientId] = useState("");
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [issueDate, setIssueDate] = useState<Date>(new Date());
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [notes, setNotes] = useState("");
	const [lineItems, setLineItems] = useState<LineItem[]>([
		{ id: "1", description: "", quantity: 1, rate: 0 },
	]);
	const [claims, setClaims] = useState<Claim[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);

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
		field: keyof LineItem,
		value: string | number
	) => {
		setLineItems(
			lineItems.map((item) =>
				item.id === id ? { ...item, [field]: value } : item
			)
		);
	};

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
		field: keyof Claim,
		value: string | number | Date
	) => {
		setClaims(
			claims.map((claim) =>
				claim.id === id ? { ...claim, [field]: value } : claim
			)
		);
	};

	const handleClaimImageUpload = async (claimId: string, file: File) => {
		try {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				toast({
					title: "Error",
					description: "Please upload an image file",
					variant: "destructive",
				});
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast({
					title: "Error",
					description: "Image must be smaller than 5MB",
					variant: "destructive",
				});
				return;
			}

			// Get upload URL
			const uploadUrl = await generateUploadUrl();

			// Upload the file
			const result = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			const { storageId } = await result.json();

			// Update the claim with the storage ID
			setClaims(
				claims.map((claim) =>
					claim.id === claimId ? { ...claim, imageStorageId: storageId } : claim
				)
			);

			toast({
				title: "Success",
				description: "Image uploaded successfully",
			});
		} catch (error) {
			console.error("Error uploading image:", error);
			toast({
				title: "Error",
				description: "Failed to upload image",
				variant: "destructive",
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

	const calculateTotal = () => {
		return calculateSubtotal() + calculateClaimsTotal() + calculateTax();
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

			router.push(`/invoices/${invoiceId}`);
		} catch (error) {
			console.error("Error creating invoice:", error);
			alert("Failed to create invoice. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!user || !currentUser) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<div className="container max-w-4xl mx-auto py-8">
			<div className="mb-6">
				<Link href="/invoices">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Invoices
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Create New Invoice</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Invoice Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="client">Client *</Label>
								<ClientSelector
									clients={clients}
									selectedClientId={selectedClientId}
									onClientSelect={setSelectedClientId}
									onCreateNewClient={(searchValue) => {
										setNewClientName(searchValue);
										setShowNewClientModal(true);
									}}
									showCreateOption={true}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="invoiceNumber">Invoice Number *</Label>
								<Input
									id="invoiceNumber"
									placeholder="INV-001"
									value={invoiceNumber}
									onChange={(e) => setInvoiceNumber(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="issueDate">Issue Date *</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!issueDate && "text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{issueDate ? (
												format(issueDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={issueDate}
											onSelect={(date) => date && setIssueDate(date)}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>

							<div className="space-y-2">
								<Label htmlFor="dueDate">Due Date *</Label>
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-full justify-start text-left font-normal",
												!dueDate && "text-muted-foreground"
											)}
										>
											<CalendarIcon className="mr-2 h-4 w-4" />
											{dueDate ? (
												format(dueDate, "PPP")
											) : (
												<span>Pick a date</span>
											)}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0" align="start">
										<Calendar
											mode="single"
											selected={dueDate}
											onSelect={setDueDate}
											initialFocus
										/>
									</PopoverContent>
								</Popover>
							</div>
						</div>

						{/* Line Items */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<Label className="text-lg">Line Items</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addLineItem}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Item
								</Button>
							</div>

							<div className="space-y-3">
								{lineItems.map((item, index) => (
									<div
										key={item.id}
										className="grid grid-cols-12 gap-3 items-end"
									>
										<div className="col-span-12 md:col-span-6 space-y-2">
											<Label htmlFor={`desc-${item.id}`}>
												Description {index === 0 && "*"}
											</Label>
											<Input
												id={`desc-${item.id}`}
												placeholder="Service or product description"
												value={item.description}
												onChange={(e) =>
													updateLineItem(item.id, "description", e.target.value)
												}
												required
											/>
										</div>

										<div className="col-span-5 md:col-span-2 space-y-2">
											<Label htmlFor={`qty-${item.id}`}>Qty</Label>
											<Input
												id={`qty-${item.id}`}
												type="number"
												min="1"
												value={item.quantity}
												onChange={(e) =>
													updateLineItem(
														item.id,
														"quantity",
														parseInt(e.target.value) || 1
													)
												}
												required
											/>
										</div>

										<div className="col-span-5 md:col-span-2 space-y-2">
											<Label htmlFor={`rate-${item.id}`}>Rate</Label>
											<Input
												id={`rate-${item.id}`}
												type="number"
												min="0"
												step="0.01"
												placeholder="0.00"
												value={item.rate || ""}
												onChange={(e) =>
													updateLineItem(
														item.id,
														"rate",
														parseFloat(e.target.value) || 0
													)
												}
												required
											/>
										</div>

										<div className="col-span-5 md:col-span-1 space-y-2">
											<Label>Amount</Label>
											<div className="h-10 flex items-center font-medium">
												${(item.quantity * item.rate).toFixed(2)}
											</div>
										</div>

										<div className="col-span-2 md:col-span-1">
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => removeLineItem(item.id)}
												disabled={lineItems.length === 1}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Claims/Expenses Section */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<Label className="text-lg">Reimbursable Expenses</Label>
									<p className="text-sm text-muted-foreground">
										Add expenses that should be reimbursed (travel, materials,
										etc.)
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addClaim}
								>
									<Plus className="h-4 w-4 mr-2" />
									Add Expense
								</Button>
							</div>

							{claims.length > 0 && (
								<div className="space-y-3">
									{claims.map((claim) => (
										<div
											key={claim.id}
											className="border rounded-lg p-4 space-y-3"
										>
											<div className="grid grid-cols-12 gap-3 items-end">
												<div className="col-span-12 md:col-span-5 space-y-2">
													<Label htmlFor={`claim-desc-${claim.id}`}>
														Description
													</Label>
													<Input
														id={`claim-desc-${claim.id}`}
														placeholder="Travel expenses, materials, etc."
														value={claim.description}
														onChange={(e) =>
															updateClaim(
																claim.id,
																"description",
																e.target.value
															)
														}
													/>
												</div>

												<div className="col-span-6 md:col-span-3 space-y-2">
													<Label htmlFor={`claim-date-${claim.id}`}>Date</Label>
													<Popover>
														<PopoverTrigger asChild>
															<Button
																variant="outline"
																className={cn(
																	"w-full justify-start text-left font-normal",
																	!claim.date && "text-muted-foreground"
																)}
															>
																<CalendarIcon className="mr-2 h-4 w-4" />
																{claim.date ? (
																	format(claim.date, "PP")
																) : (
																	<span>Pick date</span>
																)}
															</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-auto p-0"
															align="start"
														>
															<Calendar
																mode="single"
																selected={claim.date}
																onSelect={(date) =>
																	date && updateClaim(claim.id, "date", date)
																}
																initialFocus
															/>
														</PopoverContent>
													</Popover>
												</div>

												<div className="col-span-4 md:col-span-2 space-y-2">
													<Label htmlFor={`claim-amount-${claim.id}`}>
														Amount
													</Label>
													<Input
														id={`claim-amount-${claim.id}`}
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														value={claim.amount || ""}
														onChange={(e) =>
															updateClaim(
																claim.id,
																"amount",
																parseFloat(e.target.value) || 0
															)
														}
													/>
												</div>

												<div className="col-span-2 md:col-span-1 space-y-2">
													<Label className="md:hidden">Total</Label>
													<div className="h-10 flex items-center font-medium">
														${claim.amount.toFixed(2)}
													</div>
												</div>

												<div className="col-span-12 md:col-span-1">
													<Button
														type="button"
														variant="ghost"
														size="icon"
														onClick={() => removeClaim(claim.id)}
													>
														<Trash2 className="h-4 w-4 text-destructive" />
													</Button>
												</div>
											</div>

											{/* Image Upload Section */}
											<div className="flex items-center gap-3">
												<Label
													htmlFor={`claim-image-${claim.id}`}
													className="cursor-pointer"
												>
													<div className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
														{claim.imageStorageId ? (
															<>
																<ImageIcon className="h-4 w-4" />
																<span className="text-sm">Change Receipt</span>
															</>
														) : (
															<>
																<Upload className="h-4 w-4" />
																<span className="text-sm">Upload Receipt</span>
															</>
														)}
													</div>
													<input
														id={`claim-image-${claim.id}`}
														type="file"
														accept="image/*"
														className="hidden"
														onChange={(e) => {
															const file = e.target.files?.[0];
															if (file) {
																handleClaimImageUpload(claim.id, file);
															}
														}}
													/>
												</Label>

												{claim.imageStorageId && (
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => removeClaimImage(claim.id)}
													>
														<X className="h-4 w-4 mr-1" />
														Remove
													</Button>
												)}

												{claim.imageStorageId && (
													<span className="text-sm text-muted-foreground">
														✓ Receipt attached
													</span>
												)}
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Totals */}
						<div className="border-t pt-4">
							<div className="flex justify-end">
								<div className="w-full md:w-64 space-y-2">
									<div className="flex justify-between">
										<span className="text-muted-foreground">Subtotal:</span>
										<span className="font-medium">
											${calculateSubtotal().toFixed(2)}
										</span>
									</div>
									{claims.length > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">Expenses:</span>
											<span className="font-medium">
												${calculateClaimsTotal().toFixed(2)}
											</span>
										</div>
									)}
									{settings && settings.taxRate > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Tax ({(settings.taxRate * 100).toFixed(1)}%):
											</span>
											<span className="font-medium">
												${calculateTax().toFixed(2)}
											</span>
										</div>
									)}
									<div className="flex justify-between text-lg font-bold">
										<span>Total:</span>
										<span>${calculateTotal().toFixed(2)}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Notes */}
						<div className="space-y-2">
							<Label htmlFor="notes">Notes (Optional)</Label>
							<Textarea
								id="notes"
								placeholder="Additional notes or payment terms..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
								rows={3}
							/>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => router.push("/invoices")}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Creating..." : "Create Invoice"}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

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
		</div>
	);
}
