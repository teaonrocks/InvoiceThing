import { Suspense, lazy } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppData } from "@/context/app-data-provider";
import { RecentInvoicesTable } from "@/components/recent-invoices-table";
import { createFileRoute } from "@tanstack/react-router";

const DashboardCharts = lazy(() =>
	import("@/components/dashboard-charts").then((mod) => ({
		default: mod.DashboardCharts,
	}))
);

export const Route = createFileRoute("/dashboard/")({
	// Enable SSR for this route
	ssr: true,
	// Loader runs on server during SSR and on client during navigation
	loader: async ({ context }) => {
		// Try to get request from context (if available in SSR)
		// @ts-expect-error - Request may be available in SSR context
		const request = context?.request as Request | undefined;

		// Check if we're on the server
		if (typeof window === "undefined" && request) {
			try {
				// Try server-side auth and data fetching
				const { getServerAuth } = await import("@/lib/server-auth");
				const auth = await getServerAuth(request);

				if (auth?.userId) {
					// TODO: Implement Convex HTTP API calls here
					// For now, return null to let hooks handle it
					// This requires Convex HTTP API setup
					return null;
				}
			} catch (error) {
				// Server-side auth not available (e.g., @clerk/backend not installed)
				// Fall back to client-side hooks
				console.debug(
					"Server-side auth not available, using client-side hooks"
				);
			}
		}

		// Return null to let existing hooks handle data fetching
		// This ensures the component still works even without SSR
		return null;
	},
	component: DashboardPage,
});

function DashboardPage() {
	const { currentUser: convexUser, invoices } = useAppData();

	const stats = useQuery(
		api.invoices.getStats,
		convexUser?._id ? { userId: convexUser._id } : "skip"
	);

	const invoiceList = invoices ?? [];

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container mx-auto px-4 py-4 sm:py-8">
				<h1 className="mb-8 text-3xl font-bold sm:text-4xl">Dashboard</h1>

				<div className="space-y-8">
					{stats ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Total Earnings
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										${stats.totalEarnings.toFixed(2)}
									</div>
									<p className="text-xs text-muted-foreground">
										From {stats.paidInvoices} paid invoices
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Outstanding
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										${stats.totalOutstanding.toFixed(2)}
									</div>
									<p className="text-xs text-muted-foreground">
										Awaiting payment
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Total Invoices
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{stats.totalInvoices}
									</div>
									<p className="text-xs text-muted-foreground">All time</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Active Clients
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{stats.activeClients}
									</div>
									<p className="text-xs text-muted-foreground">Total clients</p>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-24" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-32 mb-2" />
									<Skeleton className="h-3 w-40" />
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-20" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-32 mb-2" />
									<Skeleton className="h-3 w-32" />
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-24" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-20 mb-2" />
									<Skeleton className="h-3 w-24" />
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<Skeleton className="h-4 w-28" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-8 w-16 mb-2" />
									<Skeleton className="h-3 w-28" />
								</CardContent>
							</Card>
						</div>
					)}

					<Card>
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
							/>
						</CardContent>
					</Card>

					<Suspense
						fallback={
							<div className="grid gap-4 lg:grid-cols-3">
								<Card className="lg:col-span-2">
									<CardHeader>
										<CardTitle>Revenue (last 12 weeks)</CardTitle>
										<p className="text-sm text-muted-foreground">
											Total and paid revenue by issue date
										</p>
									</CardHeader>
									<CardContent className="h-[240px] sm:h-[320px]">
										<div className="flex h-full items-end justify-between gap-1 px-4 pb-4">
											{Array.from({ length: 12 }).map((_, i) => {
												// Use index-based heights for consistent rendering
												const heights = [
													45, 52, 38, 60, 48, 55, 42, 58, 50, 45, 48, 52,
												];
												const paidHeights = [
													30, 35, 25, 40, 32, 38, 28, 42, 34, 30, 32, 35,
												];
												return (
													<div
														key={i}
														className="flex flex-1 flex-col items-center gap-1"
													>
														<div className="flex w-full flex-col gap-1">
															<Skeleton
																className="w-full"
																style={{ height: `${heights[i] || 50}%` }}
															/>
															<Skeleton
																className="w-full"
																style={{ height: `${paidHeights[i] || 35}%` }}
															/>
														</div>
														<Skeleton className="h-3 w-8" />
													</div>
												);
											})}
										</div>
									</CardContent>
								</Card>
								<Card>
									<CardHeader>
										<CardTitle>Invoice status mix</CardTitle>
										<p className="text-sm text-muted-foreground">
											All invoices grouped by status
										</p>
									</CardHeader>
									<CardContent className="h-[240px] sm:h-[320px]">
										<div className="flex h-full items-center justify-center">
											<Skeleton className="h-48 w-48 rounded-full" />
										</div>
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
				</div>
			</main>
		</div>
	);
}
