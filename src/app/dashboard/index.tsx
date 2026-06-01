import { Suspense, lazy, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppData } from "@/context/app-data-provider";
import { RecentInvoicesTable } from "@/components/recent-invoices-table";
import { MobileQuickActions } from "@/components/mobile-quick-actions";
import { useMobileReceipt } from "@/components/mobile-app-shell";
import { createFileRoute } from "@tanstack/react-router";

const DashboardCharts = lazy(() =>
	import("@/components/dashboard-charts").then((mod) => ({
		default: mod.DashboardCharts,
	})),
);

export const Route = createFileRoute("/dashboard/")({
	ssr: true,
	loader: async ({ context }) => {
		const { getDashboardLoaderData, getRequestFromLoaderContext } =
			await import("@/lib/server-data");
		const request = getRequestFromLoaderContext(context);

		if (process.env.NODE_ENV === "development" && typeof window === "undefined") {
			console.log("[SSR Loader] Running on server");
			console.log("[SSR Loader] Request available:", !!request);
			console.log(
				"[SSR Loader] CLERK_SECRET_KEY set:",
				!!process.env.CLERK_SECRET_KEY,
			);
		}

		if (!request) return null;
		return getDashboardLoaderData(request);
	},
	component: DashboardPage,
});

type DashboardStats = {
	totalOutstanding: number;
	totalOverdue: number;
	averageInvoiceValue: number;
	sentInvoices: number;
	overdueInvoices: number;
	totalInvoices: number;
};

type InvoiceForStats = {
	status: string;
	total: number;
};

function computeStatsFromInvoices(
	invoices: InvoiceForStats[],
): DashboardStats {
	const sentInvoices = invoices.filter((inv) => inv.status === "sent");
	const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");
	const billableInvoices = invoices.filter((inv) => inv.status !== "draft");

	const totalOutstanding = sentInvoices.reduce(
		(sum, inv) => sum + inv.total,
		0,
	);
	const totalOverdue = overdueInvoices.reduce(
		(sum, inv) => sum + inv.total,
		0,
	);
	const averageInvoiceValue =
		billableInvoices.length > 0
			? billableInvoices.reduce((sum, inv) => sum + inv.total, 0) /
				billableInvoices.length
			: 0;

	return {
		totalOutstanding,
		totalOverdue,
		averageInvoiceValue,
		sentInvoices: sentInvoices.length,
		overdueInvoices: overdueInvoices.length,
		totalInvoices: billableInvoices.length,
	};
}

function isDashboardStats(stats: unknown): stats is DashboardStats {
	return (
		typeof stats === "object" &&
		stats !== null &&
		typeof (stats as DashboardStats).totalOutstanding === "number" &&
		typeof (stats as DashboardStats).totalOverdue === "number" &&
		typeof (stats as DashboardStats).averageInvoiceValue === "number"
	);
}

function DashboardPage() {
	const { openReceiptSheet } = useMobileReceipt();
	// Try to get pre-fetched data from loader (for SSR)
	const loaderData = Route.useLoaderData();

	// Get data from context - this persists across navigation and uses Convex cache
	const {
		invoices: contextInvoices,
		stats: contextStats,
	} = useAppData();

	// Prefer SSR loader data if available, otherwise use context data
	// Context data persists across navigation and prevents loading flash
	const stats = loaderData?.stats ?? contextStats;
	const invoices = loaderData?.invoices ?? contextInvoices;
	const invoiceList = invoices ?? [];

	const displayStats = useMemo(() => {
		if (invoices === undefined) return null;
		if (isDashboardStats(stats)) return stats;
		return computeStatsFromInvoices(invoiceList);
	}, [stats, invoices, invoiceList]);

	return (
		<div className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
				<h1 className="mb-4 text-2xl font-bold sm:mb-8 sm:text-3xl">
					Dashboard
				</h1>

				<MobileQuickActions
					onUploadReceipt={() => openReceiptSheet()}
					className="mb-6"
				/>

				<div className="min-w-0 space-y-6">
					{displayStats ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<Card variant="stat">
								<CardHeader className="pb-0">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Outstanding
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-number text-2xl font-bold">
										${displayStats.totalOutstanding.toFixed(2)}
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										{displayStats.sentInvoices === 1
											? "1 sent invoice"
											: `${displayStats.sentInvoices} sent invoices`}
									</p>
								</CardContent>
							</Card>

							<Card variant="stat">
								<CardHeader className="pb-0">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Overdue
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-number text-2xl font-bold">
										${displayStats.totalOverdue.toFixed(2)}
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										{displayStats.overdueInvoices === 1
											? "1 overdue invoice"
											: `${displayStats.overdueInvoices} overdue invoices`}
									</p>
								</CardContent>
							</Card>

							<Card variant="stat">
								<CardHeader className="pb-0">
									<CardTitle className="text-sm font-medium text-muted-foreground">
										Average Invoice Value
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="font-number text-2xl font-bold">
										${displayStats.averageInvoiceValue.toFixed(2)}
									</div>
									<p className="mt-1 text-xs text-muted-foreground">
										{displayStats.totalInvoices === 1
											? "Based on 1 invoice"
											: `Based on ${displayStats.totalInvoices} invoices`}
									</p>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<Card key={i} variant="stat">
									<CardHeader className="pb-0">
										<Skeleton className="h-4 w-24" />
									</CardHeader>
									<CardContent>
										<Skeleton className="mb-2 h-8 w-28" />
										<Skeleton className="h-3 w-32" />
									</CardContent>
								</Card>
							))}
						</div>
					)}

					<Suspense
						fallback={
							<div className="grid min-w-0 gap-4 lg:grid-cols-3">
								<Card variant="panel" className="min-w-0 lg:col-span-2">
									<CardHeader>
										<CardTitle>Revenue (last 8 weeks)</CardTitle>
										<p className="text-sm text-muted-foreground">
											Total and paid revenue by issue date
										</p>
									</CardHeader>
									<CardContent className="h-[240px] md:h-[280px]">
										<Skeleton className="h-full w-full" />
									</CardContent>
								</Card>
								<Card variant="panel" className="min-w-0">
									<CardHeader>
										<CardTitle>Invoice status mix</CardTitle>
										<p className="text-sm text-muted-foreground">
											All invoices grouped by status
										</p>
									</CardHeader>
									<CardContent className="flex h-[240px] items-center justify-center md:h-[280px]">
										<Skeleton className="h-40 w-40 rounded-full" />
									</CardContent>
								</Card>
							</div>
						}
					>
						<DashboardCharts
							invoices={invoiceList}
							isLoading={invoices === undefined}
						/>
					</Suspense>

					<Card variant="panel" className="min-w-0">
						<CardHeader>
							<CardTitle>Recent invoices</CardTitle>
							<p className="text-sm text-muted-foreground">
								Your latest invoices
							</p>
						</CardHeader>
						<CardContent>
							<RecentInvoicesTable
								invoices={invoiceList}
								isLoading={invoices === undefined}
								variant="dashboard"
							/>
						</CardContent>
					</Card>
				</div>
		</div>
	);
}
