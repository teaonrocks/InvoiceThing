import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import type { Id } from "@/../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { InvoiceStatusSelect } from "@/components/invoice-status-select";
import type { InvoiceStatus } from "@/components/invoice-status-badge";
import { formatInvoiceCurrency } from "@/lib/invoice-format";
import {
	Camera,
	ChevronRight,
	Image as ReceiptIcon,
	ImageOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type MobileInvoiceCardRow = {
	_id: Id<"invoices">;
	invoiceNumber: string;
	status: InvoiceStatus;
	total: number;
	issueDate: number;
	dueDate: number;
	clientName: string;
	claimsCount?: number;
	claimsMissingReceipt?: number;
};

type MobileInvoiceCardListProps = {
	invoices: MobileInvoiceCardRow[];
	onStatusChange: (invoiceId: Id<"invoices">, status: InvoiceStatus) => void;
	onUploadReceipt: (invoiceId: Id<"invoices">) => void;
	onRowClick?: (invoice: MobileInvoiceCardRow) => void;
	disableActions?: boolean;
	filter?: string;
	onFilterChange?: (value: string) => void;
};

export function MobileInvoiceCardList({
	invoices,
	onStatusChange,
	onUploadReceipt,
	onRowClick,
	disableActions,
	filter,
	onFilterChange,
}: MobileInvoiceCardListProps) {
	const normalizedFilter = filter?.trim().toLowerCase() ?? "";
	const filtered = normalizedFilter
		? invoices.filter(
				(inv) =>
					inv.clientName.toLowerCase().includes(normalizedFilter) ||
					inv.invoiceNumber.toLowerCase().includes(normalizedFilter),
			)
		: invoices;

	return (
		<div className="space-y-3 md:hidden">
			{onFilterChange ? (
				<input
					type="search"
					placeholder="Filter by client…"
					value={filter ?? ""}
					onChange={(e) => onFilterChange(e.target.value)}
					className="h-10 w-full rounded-none border border-input bg-background px-3 text-sm"
				/>
			) : null}

			{filtered.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">
					No invoices match your search.
				</p>
			) : (
				filtered.map((invoice) => (
					<Card
						key={invoice._id}
						variant="panel"
						className="overflow-hidden"
					>
						<button
							type="button"
							className="w-full text-left"
							onClick={() => onRowClick?.(invoice)}
						>
							<div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
								<div className="min-w-0">
									<p className="font-dm text-[10px] font-600 tracking-[0.15em] uppercase text-muted-foreground">
										{invoice.clientName}
									</p>
									<p className="font-number mt-0.5 text-lg font-semibold">
										#{invoice.invoiceNumber}
									</p>
								</div>
								<div className="flex shrink-0 flex-col items-end gap-1">
									<span className="font-number text-lg font-semibold">
										{formatInvoiceCurrency(invoice.total)}
									</span>
									<InvoiceStatusBadge status={invoice.status} />
								</div>
							</div>
							<div className="flex items-center justify-between px-4 py-2 text-xs text-muted-foreground">
								<span className="font-number">
									Due {format(invoice.dueDate, "MMM d, yyyy")}
								</span>
								{invoice.claimsCount && invoice.claimsCount > 0 ? (
									<span className="inline-flex items-center gap-1">
										{invoice.claimsMissingReceipt &&
										invoice.claimsMissingReceipt > 0 ? (
											<>
												<ImageOff className="h-3.5 w-3.5" />
												{invoice.claimsMissingReceipt} missing {invoice.claimsMissingReceipt === 1 ? "receipt" : "receipts"}
											</>
										) : (
											<>
												<ReceiptIcon className="h-3.5 w-3.5" />
												{invoice.claimsCount} expense
												{invoice.claimsCount === 1 ? "" : "s"}
											</>
										)}
									</span>
								) : null}
								<ChevronRight className="h-4 w-4 shrink-0" />
							</div>
						</button>

						<div
							className="flex flex-wrap gap-2 border-t border-border bg-muted/20 px-3 py-3"
							data-no-row-click
							onClick={(e) => e.stopPropagation()}
						>
							<InvoiceStatusSelect
								value={invoice.status}
								onValueChange={(status) =>
									onStatusChange(invoice._id, status)
								}
								disabled={disableActions}
								triggerClassName="h-9 flex-1 min-w-[120px] rounded-none"
							/>
							<Button
								type="button"
								variant="outline"
								size="sm"
								className="h-9 flex-1 rounded-none"
								onClick={() => onUploadReceipt(invoice._id)}
								disabled={disableActions}
							>
								<Camera className="h-4 w-4 mr-1.5" />
								Receipt
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-9 rounded-none px-3"
								asChild
							>
								<Link to="/invoices/$id" params={{ id: invoice._id }}>
									View
								</Link>
							</Button>
						</div>
					</Card>
				))
			)}
		</div>
	);
}
