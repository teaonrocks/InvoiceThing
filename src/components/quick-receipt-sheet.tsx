import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { useReceiptUpload } from "@/hooks/use-receipt-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CalendarIcon, Upload } from "lucide-react";
import { ReceiptImagePicker } from "@/components/receipt-image-picker";

type InvoiceOption = {
	_id: Id<"invoices">;
	invoiceNumber: string;
	clientName: string;
};

type QuickReceiptSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoices: InvoiceOption[];
	defaultInvoiceId?: Id<"invoices">;
	onSuccess?: () => void;
};

export function QuickReceiptSheet({
	open,
	onOpenChange,
	invoices,
	defaultInvoiceId,
	onSuccess,
}: QuickReceiptSheetProps) {
	const { toast } = useToast();
	const { uploadReceipt, isUploading } = useReceiptUpload();
	const addClaim = useMutation(api.invoices.addClaimToInvoice);

	const [invoiceId, setInvoiceId] = useState<string>("");
	const [description, setDescription] = useState("");
	const [amount, setAmount] = useState("");
	const [date, setDate] = useState<Date>(new Date());
	const [imageStorageId, setImageStorageId] = useState<Id<"_storage"> | undefined>();
	const [isSaving, setIsSaving] = useState(false);

	const sortedInvoices = useMemo(
		() =>
			[...invoices].sort((a, b) =>
				a.invoiceNumber.localeCompare(b.invoiceNumber),
			),
		[invoices],
	);

	useEffect(() => {
		if (!open) return;
		if (defaultInvoiceId) {
			setInvoiceId(defaultInvoiceId);
		} else if (sortedInvoices.length === 1) {
			setInvoiceId(sortedInvoices[0]._id);
		}
	}, [open, defaultInvoiceId, sortedInvoices]);

	const resetForm = () => {
		setDescription("");
		setAmount("");
		setDate(new Date());
		setImageStorageId(undefined);
		if (!defaultInvoiceId) {
			setInvoiceId("");
		}
	};

	const handleFileChange = async (file: File | undefined) => {
		if (!file) return;
		const storageId = await uploadReceipt(file);
		if (storageId) {
			setImageStorageId(storageId);
			toast({
				title: "Receipt uploaded",
				description: "Image attached to this expense.",
			});
		}
	};

	const handleSubmit = async () => {
		if (!invoiceId) {
			toast({
				title: "Select an invoice",
				description: "Choose which invoice this receipt belongs to.",
				variant: "destructive",
			});
			return;
		}

		const parsedAmount = parseFloat(amount);
		if (!description.trim() || !parsedAmount || parsedAmount <= 0) {
			toast({
				title: "Missing details",
				description: "Enter a description and amount greater than zero.",
				variant: "destructive",
			});
			return;
		}

		setIsSaving(true);
		try {
			await addClaim({
				invoiceId: invoiceId as Id<"invoices">,
				description: description.trim(),
				amount: parsedAmount,
				date: date.getTime(),
				imageStorageId,
			});
			toast({
				title: "Expense added",
				description: "Receipt attached and invoice total updated.",
			});
			resetForm();
			onOpenChange(false);
			onSuccess?.();
		} catch (error) {
			console.error(error);
			toast({
				title: "Unable to save",
				description: "We couldn't add this expense. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const busy = isUploading || isSaving;

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="bottom"
				className="max-h-[92vh] overflow-y-auto rounded-none border-t border-strong px-4 pb-8 pt-6 sm:px-6"
			>
				<SheetHeader className="text-left">
					<p className="font-dm text-[11px] font-600 tracking-[0.2em] uppercase text-brand">
						Quick capture
					</p>
					<SheetTitle className="font-instrument text-xl">
						Upload receipt
					</SheetTitle>
					<SheetDescription>
						Attach a reimbursable expense to an existing invoice without
						opening the full editor.
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-5">
					<div className="space-y-2">
						<Label htmlFor="quick-receipt-invoice">Invoice</Label>
						<Select value={invoiceId} onValueChange={setInvoiceId}>
							<SelectTrigger
								id="quick-receipt-invoice"
								className="h-11 w-full rounded-none"
							>
								<SelectValue placeholder="Select invoice" />
							</SelectTrigger>
							<SelectContent>
								{sortedInvoices.map((invoice) => (
									<SelectItem key={invoice._id} value={invoice._id}>
										<span className="font-number">#{invoice.invoiceNumber}</span>
										{" — "}
										{invoice.clientName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Receipt photo</Label>
						<ReceiptImagePicker
							idPrefix="quick-receipt"
							isUploading={isUploading}
							hasImage={Boolean(imageStorageId)}
							disabled={busy}
							onFileSelect={(file) => void handleFileChange(file)}
							onRemove={() => setImageStorageId(undefined)}
						/>
						<p className="text-xs text-muted-foreground">
							JPEG, PNG, or HEIC
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="quick-receipt-description">Description</Label>
						<Input
							id="quick-receipt-description"
							placeholder="Travel, materials, meals…"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							className="rounded-none"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="quick-receipt-amount">Amount</Label>
							<Input
								id="quick-receipt-amount"
								type="number"
								min="0"
								step="0.01"
								placeholder="0.00"
								value={amount}
								onChange={(e) => setAmount(e.target.value)}
								className="font-number rounded-none"
							/>
						</div>
						<div className="space-y-2">
							<Label>Date</Label>
							<Popover>
								<PopoverTrigger asChild>
									<Button
										variant="outline"
										className={cn(
											"font-number h-10 w-full justify-start rounded-none text-left font-normal",
										)}
									>
										<CalendarIcon className="mr-2 h-4 w-4" />
										{format(date, "MMM d, yyyy")}
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={date}
										onSelect={(d) => d && setDate(d)}
										initialFocus
									/>
								</PopoverContent>
							</Popover>
						</div>
					</div>
				</div>

				<SheetFooter className="mt-8 gap-2 sm:flex-col">
					<Button
						type="button"
						variant="brand"
						className="w-full rounded-none font-dm"
						onClick={() => void handleSubmit()}
						disabled={busy}
					>
						{isSaving ? (
							<>
								<Spinner className="h-4 w-4 mr-2" />
								Saving…
							</>
						) : (
							<>
								<Upload className="h-4 w-4 mr-2" />
								Save expense
							</>
						)}
					</Button>
					<Button
						type="button"
						variant="outline"
						className="w-full rounded-none"
						onClick={() => onOpenChange(false)}
						disabled={busy}
					>
						Cancel
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
