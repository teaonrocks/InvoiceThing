import { useMemo, useState, useEffect } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { usePostHog } from "@posthog/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { InvoiceStatusSelect } from "@/components/invoice-status-select";
import type { InvoiceStatus } from "@/components/invoice-status-badge";
import { ArrowLeft, Camera, Edit, Trash2 } from "lucide-react";
import { DownloadInvoicePDF } from "@/components/download-invoice-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import {
	InvoiceEditorPreview,
	buildInvoicePreviewDataFromRecord,
} from "@/components/invoice-editor-preview";
import { useMobileReceipt } from "@/components/mobile-app-shell";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatInvoiceCurrency } from "@/lib/invoice-format";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useInvoiceSettingsBranding } from "@/hooks/use-invoice-settings-branding";
import { useInvoiceBrandingFont } from "@/hooks/use-invoice-branding-font";
import { useAppData } from "@/context/app-data-provider";

export const Route = createFileRoute("/invoices/$id")({
	component: InvoiceDetailPage,
});

function InvoiceDetailSkeleton() {
	return (
		<div className="px-4 py-6 sm:px-8 sm:py-8">
			<Skeleton className="h-9 w-36" />
			<div className="mt-6 flex flex-wrap gap-2">
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-9 w-20" />
				<Skeleton className="h-9 w-28" />
			</div>
			<Skeleton className="mx-auto mt-8 h-[40rem] max-w-4xl w-full rounded-sm border" />
		</div>
	);
}

function InvoiceDetailPage() {
	const navigate = useNavigate();
	const { id } = Route.useParams();
	const { openReceiptSheet } = useMobileReceipt();
	const { currentUser } = useAppData();
	const posthog = usePostHog();
	const { toast } = useToast();
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const invoice = useQuery(api.invoices.get, {
		invoiceId: id as Id<"invoices">,
	});
	const settings = useQuery(
		api.settings.get,
		currentUser?._id ? { userId: currentUser._id } : "skip",
	);
	const updateStatus = useMutation(api.invoices.updateStatus);
	const deleteInvoice = useMutation(api.invoices.remove);
	const branding = useInvoiceSettingsBranding(currentUser?._id);
	useInvoiceBrandingFont(branding?.fontKey);

	const previewData = useMemo(
		() =>
			invoice && branding
				? buildInvoicePreviewDataFromRecord(
						invoice,
						settings?.paymentInstructions,
						branding,
					)
				: null,
		[invoice, settings?.paymentInstructions, branding],
	);

	const claimsSummary = useMemo(() => {
		const claims = invoice?.claims ?? [];
		const missing = claims.filter((c) => !c.imageStorageId).length;
		return { total: claims.length, missing };
	}, [invoice?.claims]);

	useEffect(() => {
		if (!invoice) return;
		posthog.capture("invoice_viewed", {
			invoice_id: invoice._id,
			invoice_number: invoice.invoiceNumber,
			status: invoice.status,
			total: invoice.total,
		});
	}, [invoice?._id]);

	const handleStatusChange = async (newStatus: InvoiceStatus) => {
		if (!invoice) return;

		const previousStatus = invoice.status;
		try {
			await updateStatus({
				invoiceId: invoice._id,
				status: newStatus,
			});
			posthog.capture("invoice_status_updated", {
				invoice_id: invoice._id,
				invoice_number: invoice.invoiceNumber,
				previous_status: previousStatus,
				new_status: newStatus,
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "Failed to update status",
				description:
					error instanceof Error
						? error.message
						: "Could not update invoice status.",
				variant: "destructive",
			});
			throw error;
		}
	};

	const handleDelete = async () => {
		if (!invoice) return;

		setIsDeleting(true);
		try {
			await deleteInvoice({ invoiceId: invoice._id });
			posthog.capture("invoice_deleted", {
				invoice_id: invoice._id,
				invoice_number: invoice.invoiceNumber,
				status: invoice.status,
				total: invoice.total,
			});
			navigate({ to: "/invoices" });
		} finally {
			setIsDeleting(false);
			setDeleteOpen(false);
		}
	};

	if (!invoice || !branding || !previewData) {
		return <InvoiceDetailSkeleton />;
	}

	return (
		<div className="px-4 py-6 pb-28 sm:px-8 sm:py-8 md:pb-8">
			<Link to="/invoices">
				<Button variant="ghost" size="sm" className="-ml-2 mb-4">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Back
				</Button>
			</Link>

			{/* Mobile summary header */}
			<div className="mb-6 border border-border bg-card p-4 md:hidden">
				<p className="font-dm text-[10px] font-600 tracking-[0.15em] uppercase text-muted-foreground">
					{invoice.client?.name ?? "Client"}
				</p>
				<div className="mt-1 flex items-start justify-between gap-3">
					<h1 className="font-number text-2xl font-bold">
						#{invoice.invoiceNumber}
					</h1>
					<InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
				</div>
				<p className="font-number mt-2 text-xl font-semibold">
					{formatInvoiceCurrency(invoice.total)}
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Due {format(invoice.dueDate, "MMM d, yyyy")}
					{claimsSummary.total > 0
						? ` · ${claimsSummary.total} expense${claimsSummary.total === 1 ? "" : "s"}`
						: ""}
					{claimsSummary.missing > 0
						? ` · ${claimsSummary.missing} missing receipt`
						: ""}
				</p>
			</div>

			{/* Desktop actions */}
			<div className="mb-8 hidden flex-wrap items-center justify-end gap-2 md:flex">
				<InvoiceStatusSelect
					value={invoice.status as InvoiceStatus}
					onValueChange={handleStatusChange}
					triggerClassName="h-9"
				/>
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
				<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<AlertDialogTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className="text-destructive hover:text-destructive"
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								Delete invoice #{invoice.invoiceNumber}?
							</AlertDialogTitle>
							<AlertDialogDescription>
								This action is permanent and cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isDeleting}>
								Cancel
							</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => void handleDelete()}
								disabled={isDeleting}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>

			<div className="mx-auto w-full max-w-4xl">
				<InvoiceEditorPreview data={previewData} showLabel={false} />
			</div>

			{/* Mobile sticky action bar */}
			<div
				className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 px-3 py-3 backdrop-blur-sm md:hidden"
				style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
			>
				<div className="flex flex-wrap gap-2">
					<InvoiceStatusSelect
						value={invoice.status as InvoiceStatus}
						onValueChange={handleStatusChange}
						triggerClassName="h-10 min-w-0 flex-1 rounded-none"
					/>
					<Button
						type="button"
						variant="brand"
						size="sm"
						className="h-10 flex-1 rounded-none"
						onClick={() => openReceiptSheet(invoice._id)}
					>
						<Camera className="h-4 w-4 mr-1.5" />
						Receipt
					</Button>
					<Button
						variant="outline"
						size="sm"
						className="h-10 rounded-none px-3"
						asChild
					>
						<Link to="/invoices/$id/edit" params={{ id: invoice._id }}>
							<Edit className="h-4 w-4" />
						</Link>
					</Button>
					<DownloadInvoicePDF
						invoice={invoice}
						paymentInstructions={settings?.paymentInstructions}
						variant="outline"
						size="icon"
						className="h-10 w-10 shrink-0 rounded-none"
						compactLabel
					/>
				</div>
			</div>
		</div>
	);
}
