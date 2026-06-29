import type { ReactNode } from "react";
import { useState } from "react";
import { format } from "date-fns";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { ClientSelector } from "@/components/client-selector";
import {
	LineItemSelector,
	type LineItemSuggestion,
} from "@/components/line-item-selector";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { tableShellClassName } from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import {
	Plus,
	Trash2,
	CalendarIcon,
	X,
} from "lucide-react";
import { ReceiptImagePicker } from "@/components/receipt-image-picker";
import { cn } from "@/lib/utils";
import type { Doc } from "@/../convex/_generated/dataModel";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

import { formatInvoiceCurrency } from "@/lib/invoice-format";

export { formatInvoiceCurrency };

export const invoiceFormSectionLabelClass =
	"text-xs font-medium tracking-wide uppercase text-muted-foreground";

export const INVOICE_EDITOR_FORM_ID = "invoice-editor-form";

export function InvoiceFormPage({
	backLink,
	title,
	actions,
	children,
}: {
	backLink: ReactNode;
	title: string;
	actions?: ReactNode;
	children: ReactNode;
}) {
	return (
		<div className="px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8 lg:px-8">
			<div className="-ml-2 mb-2">{backLink}</div>
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
				<h1 className="font-heading text-xl font-semibold leading-tight sm:text-2xl">
					{title}
				</h1>
				{actions}
			</div>
			<p className="mt-1 text-sm text-muted-foreground">
				Edit on the left — preview updates as you type.
			</p>
			{children}
		</div>
	);
}

export function InvoiceEditorLayout({
	onSubmit,
	controls,
	preview,
}: {
	onSubmit: (e: React.FormEvent) => void;
	controls: ReactNode;
	preview: ReactNode;
}) {
	const isMobile = useIsMobile();
	const [previewOpen, setPreviewOpen] = useState(false);

	return (
		<form
			id={INVOICE_EDITOR_FORM_ID}
			onSubmit={onSubmit}
			className="relative mt-6"
		>
			{isMobile ? (
				<div className="mb-4 flex justify-end">
					<Sheet open={previewOpen} onOpenChange={setPreviewOpen}>
						<SheetTrigger asChild>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="rounded-none font-dm text-xs tracking-wide uppercase"
							>
								Preview invoice
							</Button>
						</SheetTrigger>
						<SheetContent
							side="bottom"
							className="max-h-[85vh] overflow-y-auto rounded-none"
						>
							<SheetHeader>
								<SheetTitle className="font-instrument text-left">
									Preview
								</SheetTitle>
							</SheetHeader>
							<div className="mt-4">{preview}</div>
						</SheetContent>
					</Sheet>
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start lg:gap-6 xl:gap-8">
				<div
					className={cn(
						"min-w-0 space-y-8",
						isMobile && "pb-24",
						!isMobile && "lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1",
					)}
				>
					{controls}
				</div>
				<div
					className={cn(
						"min-w-0",
						isMobile ? "hidden" : "lg:sticky lg:top-6 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto",
					)}
				>
					{preview}
				</div>
			</div>
		</form>
	);
}

export function InvoiceFormSection({
	title,
	description,
	action,
	children,
}: {
	title: string;
	description?: string;
	action?: ReactNode;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 className={invoiceFormSectionLabelClass}>{title}</h2>
					{description ? (
						<p className="mt-1 text-sm text-muted-foreground">{description}</p>
					) : null}
				</div>
				{action}
			</div>
			{children}
		</section>
	);
}

export type InvoiceFormLineItem = {
	id: string;
	description: string;
	quantity: number;
	rate: number;
};

export type InvoiceFormClaim = {
	id: string;
	description: string;
	amount: number;
	date: Date;
	imageStorageId?: Id<"_storage">;
};

export function InvoiceDetailsFields({
	clients,
	selectedClientId,
	onClientSelect,
	onCreateNewClient,
	showCreateOption = false,
	invoiceNumber,
	onInvoiceNumberChange,
	issueDate,
	onIssueDateChange,
	dueDate,
	onDueDateChange,
}: {
	clients: Doc<"clients">[] | undefined;
	selectedClientId: string;
	onClientSelect: (id: string) => void;
	onCreateNewClient?: (searchValue: string) => void;
	showCreateOption?: boolean;
	invoiceNumber: string;
	onInvoiceNumberChange: (value: string) => void;
	issueDate: Date | undefined;
	onIssueDateChange: (date: Date) => void;
	dueDate: Date | undefined;
	onDueDateChange: (date: Date | undefined) => void;
}) {
	return (
		<InvoiceFormSection title="Invoice details">
			<div className="space-y-4 rounded-none border border-border bg-card p-4 sm:p-5">
				<div className="space-y-2">
					<Label htmlFor="client">Client *</Label>
					<ClientSelector
						clients={clients}
						selectedClientId={selectedClientId}
						onClientSelect={onClientSelect}
						onCreateNewClient={onCreateNewClient}
						showCreateOption={showCreateOption}
					/>
				</div>
				<div className="grid gap-4 sm:grid-cols-2">
					<div className="space-y-2 sm:col-span-2">
						<Label htmlFor="invoiceNumber">Invoice number *</Label>
						<Input
							id="invoiceNumber"
							placeholder="INV-001"
							value={invoiceNumber}
							onChange={(e) => onInvoiceNumberChange(e.target.value)}
							className="font-number"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="issueDate">Issue date *</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="issueDate"
									variant="outline"
									className={cn(
										"font-number w-full justify-start text-left font-normal",
										!issueDate && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{issueDate ? (
										format(issueDate, "MMM d, yyyy")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={issueDate}
									onSelect={(date) => date && onIssueDateChange(date)}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
					<div className="space-y-2">
						<Label htmlFor="dueDate">Due date *</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									id="dueDate"
									variant="outline"
									className={cn(
										"font-number w-full justify-start text-left font-normal",
										!dueDate && "text-muted-foreground",
									)}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{dueDate ? (
										format(dueDate, "MMM d, yyyy")
									) : (
										<span>Pick a date</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={dueDate}
									onSelect={onDueDateChange}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
				</div>
			</div>
		</InvoiceFormSection>
	);
}

export function InvoiceFormActions({
	onCancel,
	cancelLabel = "Cancel",
	submitLabel,
	isSubmitting,
	placement,
}: {
	onCancel: () => void;
	cancelLabel?: string;
	submitLabel: string;
	isSubmitting: boolean;
	placement: "header" | "mobile";
}) {
	if (placement === "header") {
		return (
			<div className="hidden shrink-0 flex-wrap items-center gap-2 sm:gap-3 md:flex">
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onCancel}
					disabled={isSubmitting}
				>
					{cancelLabel}
				</Button>
				<Button
					type="submit"
					size="sm"
					form={INVOICE_EDITOR_FORM_ID}
					disabled={isSubmitting}
				>
					{isSubmitting ? (
						<>
							<Spinner className="h-4 w-4 mr-2" />
							{submitLabel}…
						</>
					) : (
						submitLabel
					)}
				</Button>
			</div>
		);
	}

	return (
		<div className="fixed inset-x-0 bottom-16 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm md:hidden">
			<div className="flex gap-2">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting}
					className="h-11 flex-1 rounded-none"
				>
					{cancelLabel}
				</Button>
				<Button
					type="submit"
					disabled={isSubmitting}
					className="h-11 flex-1 rounded-none"
				>
					{isSubmitting ? (
						<>
							<Spinner className="h-4 w-4 mr-2" />
							{submitLabel}…
						</>
					) : (
						submitLabel
					)}
				</Button>
			</div>
		</div>
	);
}

export type { LineItemSuggestion };

export function InvoiceLineItemsEditor({
	lineItems,
	onAdd,
	onRemove,
	onUpdate,
	onSelectSuggestion,
	lineItemSuggestions,
	clientSelected,
}: {
	lineItems: InvoiceFormLineItem[];
	onAdd: () => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, field: keyof InvoiceFormLineItem, value: string | number) => void;
	onSelectSuggestion: (id: string, description: string, rate: number) => void;
	lineItemSuggestions?: LineItemSuggestion[];
	clientSelected: boolean;
}) {
	return (
		<InvoiceFormSection
			title="Line items"
			action={
				<Button type="button" variant="outline" size="sm" onClick={onAdd}>
					<Plus className="h-4 w-4 mr-2" />
					Add item
				</Button>
			}
		>
			<div className={cn(tableShellClassName, "divide-y divide-border")}>
				{lineItems.map((item, index) => (
					<div
						key={item.id}
						className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_5rem_6rem_5rem_auto] sm:items-end sm:gap-3"
					>
						<div className="space-y-2 sm:col-span-1">
							<Label htmlFor={`desc-${item.id}`}>
								Description {index === 0 && "*"}
							</Label>
							<div className="flex items-center gap-2 sm:block">
								<LineItemSelector
									id={`desc-${item.id}`}
									value={item.description}
									onValueChange={(value) =>
										onUpdate(item.id, "description", value)
									}
									onSelectSuggestion={(description, rate) =>
										onSelectSuggestion(item.id, description, rate)
									}
									suggestions={lineItemSuggestions}
									clientSelected={clientSelected}
									required={index === 0}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="shrink-0 sm:hidden"
									onClick={() => onRemove(item.id)}
									disabled={lineItems.length === 1}
									aria-label="Remove line item"
								>
									<Trash2 className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`qty-${item.id}`}>Qty</Label>
							<Input
								id={`qty-${item.id}`}
								type="number"
								min="0.01"
								step="any"
								className="font-number"
								value={item.quantity}
								onChange={(e) =>
									onUpdate(
										item.id,
										"quantity",
										parseFloat(e.target.value) || 1,
									)
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor={`rate-${item.id}`}>Rate</Label>
							<Input
								id={`rate-${item.id}`}
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								className="font-number"
								value={item.rate || ""}
								onChange={(e) =>
									onUpdate(item.id, "rate", parseFloat(e.target.value) || 0)
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label>Amount</Label>
							<div className="font-number flex h-10 items-center font-medium tabular-nums">
								{formatInvoiceCurrency(item.quantity * item.rate)}
							</div>
						</div>
						<div className="hidden sm:flex sm:justify-center">
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => onRemove(item.id)}
								disabled={lineItems.length === 1}
								aria-label="Remove line item"
							>
								<Trash2 className="h-4 w-4 text-destructive" />
							</Button>
						</div>
					</div>
				))}
			</div>
		</InvoiceFormSection>
	);
}

export function InvoiceClaimsEditor({
	claims,
	uploadingClaimIds,
	onAdd,
	onRemove,
	onUpdate,
	onImageUpload,
	onImageRemove,
}: {
	claims: InvoiceFormClaim[];
	uploadingClaimIds: Set<string>;
	onAdd: () => void;
	onRemove: (id: string) => void;
	onUpdate: (
		id: string,
		field: keyof InvoiceFormClaim,
		value: string | number | Date,
	) => void;
	onImageUpload: (claimId: string, file: File) => void;
	onImageRemove: (claimId: string) => void;
}) {
	return (
		<InvoiceFormSection
			title="Reimbursable expenses"
			description="Add expenses that should be reimbursed (travel, materials, etc.)"
			action={
				<Button type="button" variant="outline" size="sm" onClick={onAdd}>
					<Plus className="h-4 w-4 mr-2" />
					Add expense
				</Button>
			}
		>
			{claims.length === 0 ? (
				<p className="text-sm text-muted-foreground">
					No reimbursable expenses added yet.
				</p>
			) : (
				<div className="space-y-4">
					{claims.map((claim) => (
						<div
							key={claim.id}
							className="rounded-none border border-border bg-card p-4 sm:p-5 space-y-4"
						>
							<div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem_6rem_5rem_auto] sm:items-end sm:gap-3">
								<div className="space-y-2">
									<Label htmlFor={`claim-desc-${claim.id}`}>Description</Label>
									<div className="flex items-center gap-2 sm:block">
										<Input
											id={`claim-desc-${claim.id}`}
											className="min-w-0 flex-1"
											placeholder="Travel expenses, materials, etc."
											value={claim.description}
											onChange={(e) =>
												onUpdate(claim.id, "description", e.target.value)
											}
										/>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											className="shrink-0 sm:hidden"
											onClick={() => onRemove(claim.id)}
											aria-label="Remove expense"
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`claim-date-${claim.id}`}>Date</Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												className={cn(
													"font-number w-full justify-start text-left font-normal",
													!claim.date && "text-muted-foreground",
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4" />
												{claim.date ? (
													format(claim.date, "MMM d, yyyy")
												) : (
													<span>Pick date</span>
												)}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={claim.date}
												onSelect={(date) =>
													date && onUpdate(claim.id, "date", date)
												}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`claim-amount-${claim.id}`}>Amount</Label>
									<Input
										id={`claim-amount-${claim.id}`}
										type="number"
										min="0"
										step="0.01"
										placeholder="0.00"
										className="font-number"
										value={claim.amount || ""}
										onChange={(e) =>
											onUpdate(
												claim.id,
												"amount",
												parseFloat(e.target.value) || 0,
											)
										}
									/>
								</div>
								<div className="space-y-2">
									<Label className="hidden sm:block">Total</Label>
									<div className="font-number flex h-10 items-center font-medium tabular-nums">
										{formatInvoiceCurrency(claim.amount)}
									</div>
								</div>
								<div className="hidden sm:flex sm:justify-center">
									<Button
										type="button"
										variant="ghost"
										size="icon"
										onClick={() => onRemove(claim.id)}
										aria-label="Remove expense"
									>
										<Trash2 className="h-4 w-4 text-destructive" />
									</Button>
								</div>
							</div>

							<div className="border-t border-border pt-4">
								<Label className="mb-2 block">Receipt</Label>
								<ReceiptImagePicker
									idPrefix={`claim-image-${claim.id}`}
									compact
									isUploading={uploadingClaimIds.has(claim.id)}
									hasImage={Boolean(claim.imageStorageId)}
									disabled={uploadingClaimIds.has(claim.id)}
									onFileSelect={(file) => onImageUpload(claim.id, file)}
									onRemove={() => onImageRemove(claim.id)}
								/>
							</div>
						</div>
					))}
				</div>
			)}
		</InvoiceFormSection>
	);
}

export function InvoiceNotesSection({
	notes,
	onNotesChange,
}: {
	notes: string;
	onNotesChange: (value: string) => void;
}) {
	return (
		<InvoiceFormSection title="Notes">
			<div className="rounded-none border border-border bg-muted/30 px-5 py-1">
				<Textarea
					id="notes"
					placeholder="Additional notes or payment terms…"
					value={notes}
					onChange={(e) => onNotesChange(e.target.value)}
					rows={4}
					className="min-h-[6rem] resize-y border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
				/>
			</div>
		</InvoiceFormSection>
	);
}
