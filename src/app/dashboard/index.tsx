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
				// Import server-side utilities
				const { getClerkToken, callConvexHttp } = await import(
					"@/lib/server-auth"
				);

				// Get Clerk user ID and JWT token
				const clerkToken = await getClerkToken(request);
				if (!clerkToken) {
					// Not authenticated, return null to use client-side hooks
					return null;
				}

				// Get Convex URL from environment
				const convexUrl =
					process.env.VITE_CONVEX_URL ||
					process.env.VITE_PUBLIC_CONVEX_URL ||
					process.env.NEXT_PUBLIC_CONVEX_URL ||
					"";

				if (!convexUrl) {
					console.warn("Convex URL not found in environment variables");
					return null;
				}

				// Get Clerk user ID for Convex queries
				const { getServerAuth } = await import("@/lib/server-auth");
				const auth = await getServerAuth(request);
				if (!auth?.userId) {
					return null;
				}

				// Fetch Convex user by Clerk ID
				const convexUser = await callConvexHttp(
					convexUrl,
					"users/getCurrentUser",
					{ clerkId: auth.userId },
					clerkToken
				);

				if (!convexUser?._id) {
					// User not found in Convex, return null
					return null;
				}

				// Fetch stats and invoices in parallel
				const [stats, invoices] = await Promise.all([
					callConvexHttp(
						convexUrl,
						"invoices/getStats",
						{ userId: convexUser._id },
						clerkToken
					),
					callConvexHttp(
						convexUrl,
						"invoices/getByUser",
						{ userId: convexUser._id },
						clerkToken
					),
				]);

				// Return pre-fetched data
				return {
					stats,
					invoices: invoices || [],
					convexUser,
				};
			} catch (error) {
				// Server-side auth/data fetching failed
				// Fall back to client-side hooks
				console.debug(
					"Server-side data fetching failed, using client-side hooks:",
					error
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
	// Try to get pre-fetched data from loader
	const loaderData = Route.useLoaderData();

	// Use loader data if available (SSR), otherwise fall back to hooks
	const { currentUser: convexUser, invoices: contextInvoices } = useAppData();

	// Prefer SSR data if available
	const stats = loaderData?.stats;
	const invoices = loaderData?.invoices ?? contextInvoices;
	const convexUserFromLoader = loaderData?.convexUser;

	// Use loader data or fall back to hooks
	const finalConvexUser = convexUserFromLoader ?? convexUser;
	const finalInvoices = invoices;

	// Fetch stats from hook if not available from loader
	const statsFromHook = useQuery(
		api.invoices.getStats,
		finalConvexUser?._id && !stats ? { userId: finalConvexUser._id } : "skip"
	);

	// Use stats from loader or hook
	const finalStats = stats ?? statsFromHook;
	const invoiceList = finalInvoices ?? [];

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container mx-auto px-4 py-4 sm:py-8">
				<h1 className="mb-8 text-3xl font-bold sm:text-4xl">Dashboard</h1>

				<div className="space-y-8">
					{finalStats ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Total Earnings
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										${finalStats.totalEarnings.toFixed(2)}
									</div>
									<p className="text-xs text-muted-foreground">
										From {finalStats.paidInvoices} paid invoices
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
										${finalStats.totalOutstanding.toFixed(2)}
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
										{finalStats.totalInvoices}
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
										{finalStats.activeClients}
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
								isLoading={finalInvoices === undefined}
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
							isLoading={finalInvoices === undefined}
						/>
					</Suspense>
				</div>
			</main>
		</div>
	);
}
