"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Plus,
	Trash2,
	ArrowLeft,
	Loader2,
	CalendarIcon,
	Upload,
	X,
	Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { useToast } from "@/hooks/use-toast";
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
};

export default function EditInvoicePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { id } = use(params);
	const { user } = useUser();
	useStoreUser();
	const { toast } = useToast();

	const invoice = useQuery(api.invoices.get, {
		invoiceId: id as Id<"invoices">,
	});
	const { currentUser, clients } = useAppData();
	const settings = useQuery(
		api.settings.get,
		currentUser ? { userId: currentUser._id } : "skip"
	);

	// Update mutation
	const updateInvoice = useMutation(api.invoices.update);
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);

	const [selectedClientId, setSelectedClientId] = useState("");
	const [invoiceNumber, setInvoiceNumber] = useState("");
	const [issueDate, setIssueDate] = useState<Date | undefined>();
	const [dueDate, setDueDate] = useState<Date | undefined>();
	const [notes, setNotes] = useState("");
	const [lineItems, setLineItems] = useState<LineItem[]>([
		{ id: "1", description: "", quantity: 1, rate: 0 },
	]);
	const [claims, setClaims] = useState<Claim[]>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load invoice data when available
	useEffect(() => {
		if (invoice && !isLoaded) {
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
				);
			}

			setClaims(
				(invoice.claims ?? []).map((claim, index) => ({
					id: claim._id || `claim-${index}`,
					description: claim.description,
					amount: claim.amount,
					date: new Date(claim.date),
					imageStorageId: claim.imageStorageId ?? undefined,
				}))
			);

			setIsLoaded(true);
		}
	}, [invoice, isLoaded]);

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

	const calculateSubtotal = () => {
		return lineItems.reduce((sum, item) => sum + item.quantity * item.rate, 0);
	};

	const addClaim = () => {
		setClaims((current) => [
			...current,
			{
				id: Date.now().toString(),
				description: "",
				amount: 0,
				date: new Date(),
			},
		]);
	};

	const removeClaim = (claimId: string) => {
		setClaims((current) => current.filter((claim) => claim.id !== claimId));
	};

	const updateClaim = (
		claimId: string,
		field: keyof Claim,
		value: string | number | Date
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
		);
	};

	const handleClaimImageUpload = async (claimId: string, file: File) => {
		try {
			if (!file.type.startsWith("image/")) {
				toast({
					title: "Invalid file",
					description: "Please upload an image file.",
					variant: "destructive",
				});
				return;
			}

			if (file.size > 5 * 1024 * 1024) {
				toast({
					title: "File too large",
					description: "Images must be 5MB or smaller.",
					variant: "destructive",
				});
				return;
			}

			const uploadUrl = await generateUploadUrl();

			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			const { storageId } = await response.json();

			setClaims((current) =>
				current.map((claim) =>
					claim.id === claimId ? { ...claim, imageStorageId: storageId } : claim
				)
			);

			toast({
				title: "Receipt uploaded",
				description: "The receipt image has been attached.",
			});
		} catch (error) {
			console.error("Error uploading receipt:", error);
			toast({
				title: "Upload failed",
				description: "We couldn't upload that image. Please try again.",
				variant: "destructive",
			});
		}
	};

	const removeClaimImage = (claimId: string) => {
		setClaims((current) =>
			current.map((claim) =>
				claim.id === claimId ? { ...claim, imageStorageId: undefined } : claim
			)
		);
	};

	const calculateClaimsTotal = () => {
		return claims.reduce((sum, claim) => sum + (claim.amount || 0), 0);
	};

	const getTaxRate = () => {
		if (settings?.taxRate !== undefined) {
			return settings.taxRate;
		}
		if (invoice?.subtotal) {
			const inferred = invoice.tax / invoice.subtotal;
			return Number.isFinite(inferred) ? inferred : 0;
		}
		return 0;
	};

	const calculateTax = () => {
		const taxRate = getTaxRate();
		return (calculateSubtotal() + calculateClaimsTotal()) * taxRate;
	};

	const calculateTotal = () => {
		return calculateSubtotal() + calculateClaimsTotal() + calculateTax();
	};

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
			return;
		}

		if (lineItems.some((item) => !item.description || item.rate <= 0)) {
			alert("Please complete all line items");
			return;
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
			});

			router.push(`/invoices/${id}`);
		} catch (error) {
			console.error("Error updating invoice:", error);
			alert("Failed to update invoice. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!user || !currentUser || !invoice) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="container max-w-4xl mx-auto py-8">
			<div className="mb-6">
				<Link href={`/invoices/${id}`}>
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Invoice
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">Edit Invoice</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						{/* Invoice Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="client">Client *</Label>
								<Select
									value={selectedClientId}
									onValueChange={setSelectedClientId}
									required
								>
									<SelectTrigger id="client">
										<SelectValue placeholder="Select a client" />
									</SelectTrigger>
									<SelectContent>
										{clients?.map((client) => (
											<SelectItem key={client._id} value={client._id}>
												{client.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
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
											onSelect={setIssueDate}
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
												value={item.rate}
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

						{/* Claims/Expenses */}
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<Label className="text-lg">Reimbursable Expenses</Label>
									<p className="text-sm text-muted-foreground">
										Attach expenses or receipts that should be reimbursed with
										this invoice.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={addClaim}
								>
									<Plus className="mr-2 h-4 w-4" /> Add Expense
								</Button>
							</div>

							{claims.length > 0 ? (
								<div className="space-y-3">
									{claims.map((claim) => (
										<div
											key={claim.id}
											className="space-y-3 rounded-lg border p-4"
										>
											<div className="grid grid-cols-12 items-end gap-3">
												<div className="col-span-12 space-y-2 md:col-span-5">
													<Label htmlFor={`claim-desc-${claim.id}`}>
														Description
													</Label>
													<Input
														id={`claim-desc-${claim.id}`}
														placeholder="Travel, materials, etc."
														value={claim.description}
														onChange={(event) =>
															updateClaim(
																claim.id,
																"description",
																event.target.value
															)
														}
													/>
												</div>

												<div className="col-span-6 space-y-2 md:col-span-3">
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
																{claim.date
																	? format(claim.date, "PP")
																	: "Pick date"}
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

												<div className="col-span-4 space-y-2 md:col-span-2">
													<Label htmlFor={`claim-amount-${claim.id}`}>
														Amount
													</Label>
													<Input
														id={`claim-amount-${claim.id}`}
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														value={
															Number.isFinite(claim.amount) ? claim.amount : ""
														}
														onChange={(event) =>
															updateClaim(
																claim.id,
																"amount",
																parseFloat(event.target.value) || 0
															)
														}
													/>
												</div>

												<div className="col-span-5 md:col-span-1">
													<Label className="md:hidden">Total</Label>
													<div className="flex h-10 items-center font-medium">
														${claim.amount.toFixed(2)}
													</div>
												</div>

												<div className="col-span-2 md:col-span-1">
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

											<div className="flex flex-wrap items-center gap-3">
												<Label
													htmlFor={`claim-image-${claim.id}`}
													className="cursor-pointer"
												>
													<div className="flex items-center gap-2 rounded-md border px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground">
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
														onChange={(event) => {
															const file = event.target.files?.[0];
															if (file) {
																handleClaimImageUpload(claim.id, file);
															}
														}}
													/>
												</Label>

												{claim.imageStorageId ? (
													<>
														<Button
															type="button"
															variant="ghost"
															size="sm"
															onClick={() => removeClaimImage(claim.id)}
														>
															<X className="mr-1 h-4 w-4" />
															Remove
														</Button>
														<span className="text-sm text-muted-foreground">
															✓ Receipt attached
														</span>
													</>
												) : null}
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-sm text-muted-foreground">
									No reimbursable expenses added yet.
								</p>
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
									{taxRate > 0 && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Tax ({(taxRate * 100).toFixed(1)}%):
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
								onClick={() => router.push(`/invoices/${id}`)}
								disabled={isSubmitting}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Updating...
									</>
								) : (
									"Update Invoice"
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
