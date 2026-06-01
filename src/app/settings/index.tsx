import { useState, useEffect, useTransition } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { usePostHog } from "@posthog/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useStoreUser } from "@/hooks/use-store-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { InvoiceLogoPicker } from "@/components/invoice-logo-picker";
import { useImageUpload } from "@/hooks/use-image-upload";
import { useInvoiceBrandingFont } from "@/hooks/use-invoice-branding-font";
import {
	DEFAULT_INVOICE_ACCENT_COLOR,
	DEFAULT_INVOICE_FONT_KEY,
	DEFAULT_INVOICE_SECONDARY_COLOR,
	INVOICE_COLOR_PRESETS,
	INVOICE_FONT_OPTIONS,
	getInvoiceFont,
	getInvoiceTextColors,
	isHexColor,
	normalizeHexColor,
	resolveInvoiceFontKey,
	type InvoiceFontKey,
} from "@/lib/invoice-branding";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { useAppData } from "@/context/app-data-provider";
import { roundToIncrement } from "@/lib/invoice-rounding";

export const Route = createFileRoute("/settings/")({
	component: SettingsPage,
});

function SettingsPageSkeleton() {
	return (
		<div className="max-w-3xl mx-auto px-4 py-4 sm:px-8 sm:py-8">
			<div className="flex items-center gap-3 mb-6 sm:mb-8">
				<Skeleton className="h-8 w-8 rounded-sm" />
				<Skeleton className="h-9 w-36 sm:h-10 sm:w-44" />
			</div>
			<div className="space-y-6">
				{[0, 1, 2].map((card) => (
					<div
						key={card}
						className="rounded-sm border border-border bg-card p-6 space-y-4"
					>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-full max-w-md" />
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 pt-2">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-10 w-full" />
						</div>
						{card === 1 ? (
							<>
								<Skeleton className="h-24 w-full" />
								<div className="flex flex-wrap gap-2">
									{Array.from({ length: 5 }).map((_, i) => (
										<Skeleton key={i} className="h-9 w-20" />
									))}
								</div>
								<Skeleton className="h-12 w-full" />
							</>
						) : card === 2 ? (
							<Skeleton className="h-40 w-full" />
						) : (
							<Skeleton className="h-10 w-full max-w-xs" />
						)}
					</div>
				))}
				<div className="flex justify-end">
					<Skeleton className="h-10 w-32" />
				</div>
			</div>
		</div>
	);
}

function SettingsPage() {
	useStoreUser();
	const { toast } = useToast();
	const posthog = usePostHog();
	const { clerkUser: user, currentUser } = useAppData();

	const settings = useQuery(
		api.settings.get,
		currentUser ? { userId: currentUser._id } : "skip",
	);
	const upsertSettings = useMutation(api.settings.upsert);

	const [invoicePrefix, setInvoicePrefix] = useState("INV");
	const [invoiceNumberStart, setInvoiceNumberStart] = useState(1);
	const [dueDateDays, setDueDateDays] = useState(14);
	const [taxRate, setTaxRate] = useState(0);
	const [paymentInstructions, setPaymentInstructions] = useState("");
	const [enableRounding, setEnableRounding] = useState(false);
	const [roundingIncrement, setRoundingIncrement] = useState(0.05);
	const [logoStorageId, setLogoStorageId] = useState<Id<"_storage"> | undefined>();
	const [clearLogo, setClearLogo] = useState(false);
	const [accentColor, setAccentColor] = useState(DEFAULT_INVOICE_ACCENT_COLOR);
	const [secondaryColor, setSecondaryColor] = useState(
		DEFAULT_INVOICE_SECONDARY_COLOR,
	);
	const [invoiceFontFamily, setInvoiceFontFamily] = useState<InvoiceFontKey>(
		DEFAULT_INVOICE_FONT_KEY,
	);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);
	const [, startTransition] = useTransition();

	const { uploadImage, isUploading: isUploadingLogo } = useImageUpload({
		preserveTransparency: true,
	});
	const logoUrl = useQuery(
		api.files.getFileUrl,
		logoStorageId && !clearLogo ? { storageId: logoStorageId } : "skip",
	);
	const isSettingsReady = settings !== undefined && isLoaded;
	useInvoiceBrandingFont(isSettingsReady ? invoiceFontFamily : undefined);

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
			setLogoStorageId(settings.logoStorageId ?? undefined);
			setClearLogo(false);
			setAccentColor(
				normalizeHexColor(settings.invoiceAccentColor ?? "") ??
					DEFAULT_INVOICE_ACCENT_COLOR,
			);
			setSecondaryColor(
				normalizeHexColor(settings.invoiceSecondaryColor ?? "") ??
					DEFAULT_INVOICE_SECONDARY_COLOR,
			);
			setInvoiceFontFamily(
				resolveInvoiceFontKey(settings.invoiceFontFamily),
			);
			setIsLoaded(true);
		}
	}, [settings, isLoaded]);

	const handleLogoUpload = async (file: File) => {
		const storageId = await uploadImage(file);
		if (storageId) {
			setLogoStorageId(storageId);
			setClearLogo(false);
			toast({
				title: "Logo uploaded",
				description: "Your logo will appear on invoices.",
			});
		}
	};

	const handleRemoveLogo = () => {
		setLogoStorageId(undefined);
		setClearLogo(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!currentUser) {
			toast({
				title: "Error",
				description: "User not found",
				variant: "destructive",
			});
			return;
		}

		const normalizedAccent = normalizeHexColor(accentColor);
		const normalizedSecondary = normalizeHexColor(secondaryColor);
		if (!normalizedAccent || !normalizedSecondary) {
			toast({
				title: "Invalid colors",
				description: "Please enter valid hex colors (e.g. #EB3D58).",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);

		startTransition(async () => {
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
					logoStorageId: clearLogo ? undefined : logoStorageId,
					clearLogo,
					invoiceAccentColor: normalizedAccent,
					invoiceSecondaryColor: normalizedSecondary,
					invoiceFontFamily,
				});

				posthog.capture("settings_saved", {
					tax_rate: taxRate,
					due_date_days: dueDateDays,
					enable_rounding: enableRounding,
					has_logo: Boolean(logoStorageId) && !clearLogo,
					has_payment_instructions: Boolean(paymentInstructions.trim()),
					font_family: invoiceFontFamily,
				});

				toast({
					title: "Success",
					description: "Settings saved successfully",
				});
			} catch (error) {
				console.error("Error saving settings:", error);
				toast({
					title: "Error",
					description: "Failed to save settings. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsSubmitting(false);
			}
		});
	};

	if (!user || !currentUser) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isSettingsReady) {
		return <SettingsPageSkeleton />;
	}

	return (
		<div className="max-w-3xl mx-auto px-4 py-4 sm:px-8 sm:py-8">
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
										Example:{" "}
										<span className="font-number">
											{invoicePrefix}-0001
										</span>
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="startNumber">Starting Invoice Number</Label>
									<Input
										id="startNumber"
										type="number"
										min="1"
										className="font-number"
										value={invoiceNumberStart}
										onChange={(e) =>
											setInvoiceNumberStart(parseInt(e.target.value) || 1)
										}
									/>
									<p className="text-xs text-muted-foreground">
										First invoice will be:{" "}
										<span className="font-number">
											{invoicePrefix}-
											{String(invoiceNumberStart).padStart(4, "0")}
										</span>
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
										className="font-number"
										value={dueDateDays}
										onChange={(e) =>
											setDueDateDays(parseInt(e.target.value) || 14)
										}
									/>
									<p className="text-xs text-muted-foreground">
										Due date will be{" "}
										<span className="font-number">{dueDateDays}</span> days from
										issue date
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
										className="font-number"
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
											Example:{" "}
											<span className="font-number">$123.47</span> →{" "}
											<span className="font-number">
												$
												{roundToIncrement(123.47, roundingIncrement).toFixed(
													2,
												)}
											</span>
										</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Invoice Branding */}
					<Card>
						<CardHeader>
							<CardTitle>Invoice Branding</CardTitle>
							<CardDescription>
								Add your logo, colors, and font to personalize invoices
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Label>Logo</Label>
								<InvoiceLogoPicker
									idPrefix="settings-logo"
									logoUrl={clearLogo ? undefined : (logoUrl ?? undefined)}
									onFileSelect={handleLogoUpload}
									onRemove={handleRemoveLogo}
									isUploading={isUploadingLogo}
								/>
							</div>

							<div className="space-y-3">
								<Label>Color presets</Label>
								<div className="flex flex-wrap gap-2">
									{INVOICE_COLOR_PRESETS.map((preset) => (
										<button
											key={preset.name}
											type="button"
											className="flex items-center gap-2 rounded-none border border-border px-3 py-2 text-xs transition-colors hover:border-brand"
											onClick={() => {
												setAccentColor(preset.accent);
												setSecondaryColor(preset.secondary);
											}}
										>
											<span
												className="h-4 w-4 shrink-0 rounded-full border border-border"
												style={{ backgroundColor: preset.accent }}
											/>
											{preset.name}
										</button>
									))}
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="accentColor">Accent color</Label>
									<div className="flex gap-2">
										<Input
											id="accentColorPicker"
											type="color"
											value={accentColor}
											onChange={(e) => setAccentColor(e.target.value)}
											className="h-10 w-14 shrink-0 cursor-pointer rounded-none p-1"
										/>
										<Input
											id="accentColor"
											value={accentColor}
											onChange={(e) => setAccentColor(e.target.value)}
											placeholder="#EB3D58"
											className="font-number"
										/>
									</div>
									{!isHexColor(accentColor) ? (
										<p className="text-xs text-destructive">
											Enter a valid hex color
										</p>
									) : null}
								</div>
								<div className="space-y-2">
									<Label htmlFor="secondaryColor">Secondary color</Label>
									<div className="flex gap-2">
										<Input
											id="secondaryColorPicker"
											type="color"
											value={secondaryColor}
											onChange={(e) => setSecondaryColor(e.target.value)}
											className="h-10 w-14 shrink-0 cursor-pointer rounded-none p-1"
										/>
										<Input
											id="secondaryColor"
											value={secondaryColor}
											onChange={(e) => setSecondaryColor(e.target.value)}
											placeholder="#F5F3F0"
											className="font-number"
										/>
									</div>
									{!isHexColor(secondaryColor) ? (
										<p className="text-xs text-destructive">
											Enter a valid hex color
										</p>
									) : null}
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="invoiceFont">Invoice font</Label>
								<Select
									value={invoiceFontFamily}
									onValueChange={(value) =>
										setInvoiceFontFamily(value as InvoiceFontKey)
									}
								>
									<SelectTrigger id="invoiceFont" className="w-full">
										<SelectValue placeholder="Select a font">
											{getInvoiceFont(invoiceFontFamily).label}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{INVOICE_FONT_OPTIONS.map((font) => (
											<SelectItem
												key={font.key}
												value={font.key}
												textValue={font.label}
											>
												<span style={{ fontFamily: font.cssFamily }}>
													{font.label}
												</span>
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<p
									className="rounded-sm border border-border px-4 py-3 text-lg"
									style={{
										fontFamily: getInvoiceFont(invoiceFontFamily).cssFamily,
										color: getInvoiceTextColors(
											isHexColor(accentColor)
												? accentColor
												: DEFAULT_INVOICE_ACCENT_COLOR,
											isHexColor(secondaryColor)
												? secondaryColor
												: DEFAULT_INVOICE_SECONDARY_COLOR,
										).accent,
										backgroundColor: isHexColor(secondaryColor)
											? secondaryColor
											: DEFAULT_INVOICE_SECONDARY_COLOR,
									}}
								>
									Preview: Invoice #{invoicePrefix}-0001
								</p>
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
									className="font-number text-sm"
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
		</div>
	);
}
