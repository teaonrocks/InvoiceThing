import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
	type ReactNode,
} from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Camera, FileText, LayoutDashboard, Receipt } from "lucide-react";
import { useAppData } from "@/context/app-data-provider";
import { QuickReceiptSheet } from "@/components/quick-receipt-sheet";
import type { Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

type MobileReceiptContextValue = {
	openReceiptSheet: (invoiceId?: Id<"invoices">) => void;
};

const MobileReceiptContext = createContext<MobileReceiptContextValue | null>(
	null,
);

export function useMobileReceipt() {
	const ctx = useContext(MobileReceiptContext);
	if (!ctx) {
		throw new Error("useMobileReceipt must be used within MobileAppShell");
	}
	return ctx;
}

export function useMobileReceiptOptional() {
	return useContext(MobileReceiptContext);
}

export function MobileAppShell({ children }: { children: ReactNode }) {
	const { invoices } = useAppData();
	const location = useLocation();
	const [receiptOpen, setReceiptOpen] = useState(false);
	const [defaultInvoiceId, setDefaultInvoiceId] = useState<
		Id<"invoices"> | undefined
	>();

	const invoiceOptions = useMemo(
		() =>
			(invoices ?? []).map((inv) => ({
				_id: inv._id as Id<"invoices">,
				invoiceNumber: inv.invoiceNumber,
				clientName: inv.client?.name ?? "Unknown client",
			})),
		[invoices],
	);

	const openReceiptSheet = useCallback((invoiceId?: Id<"invoices">) => {
		setDefaultInvoiceId(invoiceId);
		setReceiptOpen(true);
	}, []);

	const pathname = location.pathname;
	const isDashboard = pathname === "/dashboard" || pathname === "/dashboard/";
	const isInvoices =
		pathname === "/invoices" || pathname.startsWith("/invoices/");

	return (
		<MobileReceiptContext.Provider value={{ openReceiptSheet }}>
			<div className="flex min-h-0 flex-1 flex-col">
				<div className="min-h-0 flex-1 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
					{children}
				</div>

				<nav
					className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card md:hidden"
					style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
				>
					<div className="grid h-16 grid-cols-4">
						<MobileNavLink
							to="/dashboard"
							label="Home"
							icon={LayoutDashboard}
							active={isDashboard}
						/>
						<MobileNavLink
							to="/invoices"
							label="Invoices"
							icon={Receipt}
							active={isInvoices && pathname === "/invoices"}
						/>
						<button
							type="button"
							className="flex flex-col items-center justify-center gap-0.5 font-dm text-[10px] text-muted-foreground transition-colors hover:text-foreground"
							onClick={() => openReceiptSheet()}
							aria-label="Upload receipt"
						>
							<Camera className="h-5 w-5" strokeWidth={1.5} />
							Receipt
						</button>
						<MobileNavLink
							to="/invoices/new"
							label="New"
							icon={FileText}
							active={pathname === "/invoices/new"}
						/>
					</div>
				</nav>

				<QuickReceiptSheet
					open={receiptOpen}
					onOpenChange={setReceiptOpen}
					invoices={invoiceOptions}
					defaultInvoiceId={defaultInvoiceId}
				/>
			</div>
		</MobileReceiptContext.Provider>
	);
}

function MobileNavLink({
	to,
	label,
	icon: Icon,
	active,
}: {
	to: string;
	label: string;
	icon: typeof LayoutDashboard;
	active: boolean;
}) {
	return (
		<Link
			to={to}
			className={cn(
				"flex flex-col items-center justify-center gap-0.5 font-dm text-[10px] transition-colors",
				active
					? "text-brand"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			<Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
			{label}
		</Link>
	);
}
