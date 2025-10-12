"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useStoreUser } from "@/hooks/use-store-user";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Settings as SettingsIcon } from "lucide-react";
import { useAppData } from "@/context/app-data-provider";

export default function SettingsPage() {
	useStoreUser();
	const { toast } = useToast();
	const { clerkUser: user, currentUser } = useAppData();

	const settings = useQuery(
		api.settings.get,
		currentUser ? { userId: currentUser._id } : "skip"
	);
	const upsertSettings = useMutation(api.settings.upsert);

	const [invoicePrefix, setInvoicePrefix] = useState("INV");
	const [invoiceNumberStart, setInvoiceNumberStart] = useState(1);
	const [dueDateDays, setDueDateDays] = useState(14);
	const [taxRate, setTaxRate] = useState(0);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load settings when available
	useEffect(() => {
		if (settings && !isLoaded) {
			setInvoicePrefix(settings.invoicePrefix);
			setInvoiceNumberStart(settings.invoiceNumberStart);
			setDueDateDays(settings.dueDateDays);
			setTaxRate(settings.taxRate * 100); // Convert to percentage
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
			});
			return;
		}

		setIsSubmitting(true);

		try {
			await upsertSettings({
				userId: currentUser._id,
				invoicePrefix,
				invoiceNumberStart,
				dueDateDays,
				taxRate: taxRate / 100, // Convert percentage to decimal
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
	};

	if (!user || !currentUser) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container max-w-3xl mx-auto px-4 py-8">
				<div className="flex items-center gap-3 mb-8">
					<SettingsIcon className="h-8 w-8" />
					<h1 className="text-4xl font-bold">Settings</h1>
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
	);
}
