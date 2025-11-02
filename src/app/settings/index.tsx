import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-store-user";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { useAppData } from "@/context/app-data-provider";

// Utility function to round invoice total (same as in backend)
function roundToIncrement(value: number, increment: number): number {
	if (increment <= 0) return value;
	return Math.round(value / increment) * increment;
}

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

function SettingsPage() {
	useStoreUser();
	const { toast } = useToast();
	const { clerkUser: user, currentUser } = useAppData();

	const settings = useQuery(
		api.settings.get,
		currentUser ? { userId: currentUser._id } : "skip"
	)
	const upsertSettings = useMutation(api.settings.upsert);

	const [invoicePrefix, setInvoicePrefix] = useState("INV");
	const [invoiceNumberStart, setInvoiceNumberStart] = useState(1);
	const [dueDateDays, setDueDateDays] = useState(14);
	const [taxRate, setTaxRate] = useState(0);
	const [paymentInstructions, setPaymentInstructions] = useState("");
	const [enableRounding, setEnableRounding] = useState(false);
	const [roundingIncrement, setRoundingIncrement] = useState(0.05);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load settings when available
	useEffect(() => {
		if (settings && !isLoaded) {
			setInvoicePrefix(settings.invoicePrefix);
			setInvoiceNumberStart(settings.invoiceNumberStart);
			setDueDateDays(settings.dueDateDays);
			setTaxRate(settings.taxRate * 100); // Convert to percentage
			setPaymentInstructions(settings.paymentInstructions || "");
			setEnableRounding(settings.enableRounding ?? false);
			setRoundingIncrement(settings.roundingIncrement ?? 0.05);
			setIsLoaded(true);
		}
	}, [settings, isLoaded]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!currentUser) {
			toast({
				title: "Error",
				description: "User not found",
				variant: "destructive",
			})
			return
		}

		setIsSubmitting(true);

		try {
			await upsertSettings({
				userId: currentUser._id,
				invoicePrefix,
				invoiceNumberStart,
				dueDateDays,
				taxRate: taxRate / 100, // Convert percentage to decimal
				paymentInstructions: paymentInstructions.trim() || undefined,
				enableRounding,
				roundingIncrement,
			})

			toast({
				title: "Success",
				description: "Settings saved successfully",
			})
		} catch (error) {
			console.error("Error saving settings:", error);
			toast({
				title: "Error",
				description: "Failed to save settings. Please try again.",
				variant: "destructive",
			})
		} finally {
			setIsSubmitting(false);
		}
	}

	if (!user || !currentUser) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		)
	}

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container max-w-3xl mx-auto px-4 py-4 sm:py-8">
				<div className="flex items-center gap-3 mb-6 sm:mb-8">
					<SettingsIcon className="h-6 w-6 sm:h-8 sm:w-8" />
					<h1 className="text-3xl sm:text-4xl font-bold">Settings</h1>
				</div>

				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Invoice Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Invoice Settings</CardTitle>
							<CardDescription>
								Configure default settings for invoice generation
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="prefix">Invoice Prefix</Label>
									<Input
										id="prefix"
										value={invoicePrefix}
										onChange={(e) =>
											setInvoicePrefix(e.target.value.toUpperCase())
										}
										placeholder="INV"
										maxLength={10}
									/>
									<p className="text-xs text-muted-foreground">
										Example: {invoicePrefix}-0001
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="startNumber">Starting Invoice Number</Label>
									<Input
										id="startNumber"
										type="number"
										min="1"
										value={invoiceNumberStart}
										onChange={(e) =>
											setInvoiceNumberStart(parseInt(e.target.value) || 1)
										}
									/>
									<p className="text-xs text-muted-foreground">
										First invoice will be: {invoicePrefix}-
										{String(invoiceNumberStart).padStart(4, "0")}
									</p>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="dueDateDays">Default Due Date (Days)</Label>
									<Input
										id="dueDateDays"
										type="number"
										min="1"
										max="365"
										value={dueDateDays}
										onChange={(e) =>
											setDueDateDays(parseInt(e.target.value) || 14)
										}
									/>
									<p className="text-xs text-muted-foreground">
										Due date will be {dueDateDays} days from issue date
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="taxRate">Default Tax Rate (%)</Label>
									<Input
										id="taxRate"
										type="number"
										min="0"
										max="100"
										step="0.1"
										value={taxRate}
										onChange={(e) =>
											setTaxRate(parseFloat(e.target.value) || 0)
										}
									/>
									<p className="text-xs text-muted-foreground">
										Set to 0 for no tax, or enter tax rate (e.g., 10 for 10%)
									</p>
								</div>
							</div>

							{/* Rounding Settings */}
							<div className="border-t pt-4 space-y-4">
								<div className="flex items-center justify-between">
									<div className="space-y-0.5">
										<Label htmlFor="enableRounding">
											Enable Invoice Rounding
										</Label>
										<p className="text-xs text-muted-foreground">
											Round invoice totals to nearest increment for cleaner
											amounts
										</p>
									</div>
									<Switch
										id="enableRounding"
										checked={enableRounding}
										onCheckedChange={setEnableRounding}
									/>
								</div>

								{enableRounding && (
									<div className="space-y-2">
										<Label htmlFor="roundingIncrement">
											Rounding Increment
										</Label>
										<Select
											value={roundingIncrement.toString()}
											onValueChange={(value) =>
												setRoundingIncrement(parseFloat(value))
											}
										>
											<SelectTrigger id="roundingIncrement">
												<SelectValue placeholder="Select rounding increment" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="0.01">
													$0.01 (Nearest cent)
												</SelectItem>
												<SelectItem value="0.05">
													$0.05 (Nearest nickel)
												</SelectItem>
												<SelectItem value="0.1">
													$0.10 (Nearest dime)
												</SelectItem>
												<SelectItem value="0.25">
													$0.25 (Nearest quarter)
												</SelectItem>
												<SelectItem value="0.5">
													$0.50 (Nearest 50 cents)
												</SelectItem>
												<SelectItem value="1">
													$1.00 (Nearest dollar)
												</SelectItem>
												<SelectItem value="5">$5.00 (Nearest $5)</SelectItem>
												<SelectItem value="10">$10.00 (Nearest $10)</SelectItem>
											</SelectContent>
										</Select>
										<p className="text-xs text-muted-foreground">
											Example: $123.47 → $
											{roundToIncrement(123.47, roundingIncrement).toFixed(2)}
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Payment Information */}
					<Card>
						<CardHeader>
							<CardTitle>Payment Information</CardTitle>
							<CardDescription>
								Add payment instructions to show on your invoices
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="paymentInstructions">
									Payment Instructions
								</Label>
								<Textarea
									id="paymentInstructions"
									value={paymentInstructions}
									onChange={(e) => setPaymentInstructions(e.target.value)}
									placeholder="Example:&#10;&#10;Bank Transfer:&#10;Bank: ABC Bank&#10;Account Name: Your Business Name&#10;Account Number: 1234567890&#10;&#10;PayPal: yourname@example.com&#10;&#10;Venmo: @yourname"
									rows={8}
									className="font-mono text-sm"
								/>
								<p className="text-xs text-muted-foreground">
									This information will appear on your invoices to help clients
									pay you. Leave blank to hide this section.
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Save Button */}
					<div className="flex justify-end">
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Saving...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Save Settings
								</>
							)}
						</Button>
					</div>
				</form>
			</main>
		</div>
	)
}
