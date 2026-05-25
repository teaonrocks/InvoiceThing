import { useMemo } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { InvoiceStatusSelect } from "@/components/invoice-status-select";
import type { InvoiceStatus } from "@/components/invoice-status-badge";
import { ArrowLeft, Trash2, Edit } from "lucide-react";
import { DownloadInvoicePDF } from "@/components/download-invoice-pdf";
import { Skeleton } from "@/components/ui/skeleton";
import {
	InvoiceEditorPreview,
	buildInvoicePreviewDataFromRecord,
} from "@/components/invoice-editor-preview";

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
	const invoice = useQuery(api.invoices.get, {
		invoiceId: id as Id<"invoices">,
	});
	const settings = useQuery(
		api.settings.get,
		invoice?.userId ? { userId: invoice.userId } : "skip",
	);
	const updateStatus = useMutation(api.invoices.updateStatus);
	const deleteInvoice = useMutation(api.invoices.remove);

	const previewData = useMemo(
		() =>
			invoice
				? buildInvoicePreviewDataFromRecord(
						invoice,
						settings?.paymentInstructions,
					)
				: null,
		[invoice, settings?.paymentInstructions],
	);

	const handleStatusChange = async (newStatus: InvoiceStatus) => {
		if (!invoice) return;

		await updateStatus({
			invoiceId: invoice._id,
			status: newStatus,
		});
	};

	const handleDelete = async () => {
		if (!invoice) return;

		if (
			confirm(
				`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`,
			)
		) {
			await deleteInvoice({ invoiceId: invoice._id });
			navigate({ to: "/invoices" });
		}
	};

	if (!invoice || !previewData) {
		return <InvoiceDetailSkeleton />;
	}

	return (
		<div className="px-4 py-6 sm:px-8 sm:py-8">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<Link to="/invoices">
					<Button variant="ghost" size="sm" className="-ml-2">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back
					</Button>
				</Link>

				<div className="flex flex-wrap items-center gap-2">
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
					<Button
						variant="outline"
						size="sm"
						onClick={handleDelete}
						className="text-destructive hover:text-destructive"
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Delete
					</Button>
				</div>
			</div>

			<div className="mx-auto mt-8 w-full max-w-4xl">
				<InvoiceEditorPreview data={previewData} showLabel={false} />
			</div>
		</div>
	);
}
