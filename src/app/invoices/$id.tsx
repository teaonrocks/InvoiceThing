import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	ArrowLeft,
	Mail,
	Trash2,
	Edit,
	Image as ImageIcon,
	ImageOff,
	ExternalLink,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { DownloadInvoicePDF } from "@/components/download-invoice-pdf";
import { formatAddressParts } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/invoices/$id")({
	component: InvoiceDetailPage,
});

// Component to view claim receipt images
function ClaimImageViewer({ storageId }: { storageId: Id<"_storage"> }) {
	const [isOpen, setIsOpen] = useState(false);
	const imageUrl = useQuery(api.files.getFileUrl, { storageId });

	if (!imageUrl) {
		return <Skeleton className="h-8 w-20" />;
	}

	return (
		<>
			<Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
				<ImageIcon className="h-4 w-4 mr-1" />
				View
			</Button>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="max-w-[min(90vw,900px)] overflow-hidden">
					<DialogHeader>
						<DialogTitle>Receipt Image</DialogTitle>
					</DialogHeader>
					{imageUrl ? (
						<div className="flex max-h-[75vh] w-full items-center justify-center overflow-hidden rounded-lg bg-muted/40">
							<img
								src={imageUrl}
								alt="Receipt"
								className="h-full w-full max-h-[75vh] object-contain"
							/>
						</div>
					) : (
						<div className="flex items-center justify-center h-64">
							<Skeleton className="h-64 w-full max-w-md" />
						</div>
					)}
					<DialogFooter>
						{imageUrl && (
							<Button
								variant="outline"
								onClick={() => window.open(imageUrl, "_blank")}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Open in New Tab
							</Button>
						)}
						<Button onClick={() => setIsOpen(false)}>Close</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}

function InvoiceDetailPage() {
	const navigate = useNavigate();
	const { id } = Route.useParams();
	const invoice = useQuery(api.invoices.get, {
		invoiceId: id as Id<"invoices">,
	});
	const settings = useQuery(
		api.settings.get,
		invoice?.userId ? { userId: invoice.userId } : "skip"
	);
	const updateStatus = useMutation(api.invoices.updateStatus);
	const deleteInvoice = useMutation(api.invoices.remove);

	const handleStatusChange = async (newStatus: string) => {
		if (!invoice) return;

		await updateStatus({
			invoiceId: invoice._id,
			status: newStatus as "draft" | "sent" | "paid" | "overdue",
		});
	};

	const handleDelete = async () => {
		if (!invoice) return;

		if (
			confirm(
				`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`
			)
		) {
			await deleteInvoice({ invoiceId: invoice._id });
			navigate({ to: "/invoices" });
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "paid":
				return "bg-green-500";
			case "sent":
				return "bg-blue-500";
			case "overdue":
				return "bg-red-500";
			case "draft":
				return "bg-gray-500";
			default:
				return "bg-gray-500";
		}
	};

	if (!invoice) {
		return (
			<div className="min-h-screen">
				<Navigation />
				<div className="container max-w-5xl mx-auto py-4 px-4 sm:py-8 sm:px-6">
					<div className="mb-6">
						<Skeleton className="h-10 w-32" />
					</div>
					<Card>
						<CardHeader>
							<Skeleton className="h-8 w-48 mb-4" />
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent className="space-y-8">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div>
									<Skeleton className="h-6 w-24 mb-3" />
									<Skeleton className="h-5 w-32 mb-2" />
									<Skeleton className="h-4 w-48 mb-2" />
									<Skeleton className="h-4 w-40" />
								</div>
								<div className="space-y-3">
									<div className="flex justify-between">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="flex justify-between">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-32" />
									</div>
									<div className="flex justify-between">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-4 w-20" />
									</div>
								</div>
							</div>
							<div>
								<Skeleton className="h-6 w-24 mb-3" />
								<Skeleton className="h-24 w-full" />
							</div>
							<div>
								<Skeleton className="h-6 w-40 mb-3" />
								<div className="flex justify-end">
									<Skeleton className="h-20 w-80" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	const formattedClientAddress = formatAddressParts({
		streetName: invoice.client?.streetName,
		buildingName: invoice.client?.buildingName,
		unitNumber: invoice.client?.unitNumber,
		postalCode: invoice.client?.postalCode,
	});

	return (
		<div className="min-h-screen">
			<Navigation />
			<div className="container max-w-5xl mx-auto py-4 px-4 sm:py-8 sm:px-6">
				{/* Header */}
				<div className="mb-6">
					<Link to="/invoices">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Invoices
						</Button>
					</Link>
				</div>

				<Card>
					<CardHeader>
						<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<CardTitle className="text-2xl sm:text-3xl">
									Invoice #{invoice.invoiceNumber}
								</CardTitle>
								<div className="mt-2 flex items-center gap-3 flex-wrap">
									<Badge className={getStatusColor(invoice.status)}>
										{invoice.status}
									</Badge>
									<Select
										value={invoice.status}
										onValueChange={handleStatusChange}
									>
										<SelectTrigger className="w-[150px]">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="draft">Draft</SelectItem>
											<SelectItem value="sent">Sent</SelectItem>
											<SelectItem value="paid">Paid</SelectItem>
											<SelectItem value="overdue">Overdue</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="flex gap-2 flex-wrap">
								<Button variant="outline" size="sm" asChild>
									<Link to="/invoices/$id/edit" params={{ id: invoice._id }}>
										<Edit className="h-4 w-4 mr-2" />
										Edit
									</Link>
								</Button>
								<DownloadInvoicePDF
									invoice={invoice}
									paymentInstructions={settings?.paymentInstructions}
								/>
								<Button variant="outline" size="sm" disabled>
									<Mail className="h-4 w-4 mr-2" />
									Email
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={handleDelete}
									className="text-destructive"
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent className="space-y-8">
						{/* Invoice Info */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div>
								<h3 className="font-semibold mb-3">Bill To:</h3>
								<div className="space-y-1">
									<p className="font-medium">{invoice.client?.name}</p>
									<p className="text-sm text-muted-foreground">
										{invoice.client?.email}
									</p>
									{formattedClientAddress && (
										<p className="text-sm text-muted-foreground">
											{formattedClientAddress}
										</p>
									)}
									{invoice.client?.contactPerson && (
										<p className="text-sm text-muted-foreground">
											Contact: {invoice.client.contactPerson}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-3">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Issue Date:</span>
									<span className="font-medium">
										{new Date(invoice.issueDate).toLocaleDateString()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Due Date:</span>
									<span className="font-medium">
										{new Date(invoice.dueDate).toLocaleDateString()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Status:</span>
									<Badge className={getStatusColor(invoice.status)}>
										{invoice.status}
									</Badge>
								</div>
							</div>
						</div>

						{/* Line Items */}
						<div>
							<h3 className="font-semibold mb-3">Items:</h3>
							<div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead className="min-w-[200px]">
												Description
											</TableHead>
											<TableHead className="text-right whitespace-nowrap">
												Quantity
											</TableHead>
											<TableHead className="text-right whitespace-nowrap">
												Unit Price
											</TableHead>
											<TableHead className="text-right whitespace-nowrap">
												Amount
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{invoice.lineItems?.map((item) => (
											<TableRow key={item._id}>
												<TableCell>{item.description}</TableCell>
												<TableCell className="text-right">
													{item.quantity}
												</TableCell>
												<TableCell className="text-right">
													${item.unitPrice.toFixed(2)}
												</TableCell>
												<TableCell className="text-right">
													${item.total.toFixed(2)}
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>

						{/* Claims/Expenses */}
						{invoice.claims && invoice.claims.length > 0 && (
							<div>
								<h3 className="font-semibold mb-3">Reimbursable Expenses:</h3>
								<div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="min-w-[200px]">
													Description
												</TableHead>
												<TableHead className="text-right whitespace-nowrap">
													Date
												</TableHead>
												<TableHead className="text-right whitespace-nowrap">
													Amount
												</TableHead>
												<TableHead className="text-center whitespace-nowrap">
													Receipt
												</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{invoice.claims.map((claim) => (
												<TableRow key={claim._id}>
													<TableCell>{claim.description}</TableCell>
													<TableCell className="text-right">
														{new Date(claim.date).toLocaleDateString()}
													</TableCell>
													<TableCell className="text-right">
														${claim.amount.toFixed(2)}
													</TableCell>
													<TableCell className="text-center">
														{claim.imageStorageId ? (
															<ClaimImageViewer
																storageId={claim.imageStorageId}
															/>
														) : (
															<ImageOff
																className="mx-auto h-4 w-4 text-muted-foreground"
																role="img"
																aria-label="No receipt"
															/>
														)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							</div>
						)}

						{/* Totals */}
						<div className="flex justify-end">
							<div className="w-full md:w-80 space-y-2">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Subtotal:</span>
									<span className="font-medium">
										${invoice.subtotal.toFixed(2)}
									</span>
								</div>
								{invoice.tax > 0 && (
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Tax ({((invoice.tax / invoice.subtotal) * 100).toFixed(1)}
											%):
										</span>
										<span className="font-medium">
											${invoice.tax.toFixed(2)}
										</span>
									</div>
								)}
								{invoice.roundingAdjustment &&
									Math.abs(invoice.roundingAdjustment) >= 0.001 && (
										<div className="flex justify-between gap-4">
											<span className="text-muted-foreground shrink-0">
												Rounding:
											</span>
											<span className="font-medium text-right">
												{invoice.roundingAdjustment > 0 ? "+" : ""}$
												{invoice.roundingAdjustment.toFixed(2)}
											</span>
										</div>
									)}
								<div className="border-t pt-2 flex justify-between text-lg font-bold">
									<span>Total:</span>
									<span>${invoice.total.toFixed(2)}</span>
								</div>
							</div>
						</div>

						{/* Notes */}
						{invoice.notes && (
							<div>
								<h3 className="font-semibold mb-2">Notes:</h3>
								<p className="text-sm text-muted-foreground whitespace-pre-wrap">
									{invoice.notes}
								</p>
							</div>
						)}

						{/* Footer */}
						<div className="border-t pt-4 text-center text-sm text-muted-foreground">
							<p>
								Created on {new Date(invoice.createdAt).toLocaleDateString()} •
								Last updated {new Date(invoice.updatedAt).toLocaleDateString()}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
