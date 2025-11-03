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
		// Nitro passes request as event.request in some setups
		let request: Request | undefined;

		// Check context.request (standard TanStack Start)
		if (context && typeof context === "object" && "request" in context) {
			request = (context as any).request as Request | undefined;
		}

		// Check context.event.request (Nitro format)
		if (
			!request &&
			context &&
			typeof context === "object" &&
			"event" in context
		) {
			const event = (context as any).event;
			if (event && typeof event === "object" && "request" in event) {
				request = event.request as Request | undefined;
			}
		}

		// Fallback: check globalThis (for some SSR setups)
		if (!request && typeof globalThis !== "undefined") {
			const globalRequest = (globalThis as any).request;
			if (globalRequest instanceof Request) {
				request = globalRequest;
			}
		}

		// Check if we're on the server
		if (typeof window === "undefined") {
			try {
				// Import server-side utilities
				const { getClerkToken, callConvexHttp } = await import(
					"@/lib/server-auth"
				);

				// Debug: Log if we're on server and if request is available
				if (process.env.NODE_ENV === "development") {
					console.log("[SSR Loader] Running on server");
					console.log("[SSR Loader] Request available:", !!request);
					console.log(
						"[SSR Loader] CLERK_SECRET_KEY set:",
						!!process.env.CLERK_SECRET_KEY
					);
				}

				// If no request, we can't authenticate - fall back to client-side
				if (!request) {
					if (process.env.NODE_ENV === "development") {
						console.log(
							"[SSR Loader] No request available, falling back to client-side hooks"
						);
					}
					return null;
				}

				// Get Clerk user ID and JWT token
				const clerkToken = await getClerkToken(request);
				if (!clerkToken) {
					// Not authenticated, return null to use client-side hooks
					if (process.env.NODE_ENV === "development") {
						console.log(
							"[SSR Loader] No Clerk token available, falling back to client-side hooks"
						);
					}
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
						<div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-xs font-medium sm:text-sm">
										Total Earnings
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-xl font-bold sm:text-2xl">
										${finalStats.totalEarnings.toFixed(2)}
									</div>
									<p className="text-xs text-muted-foreground">
										From {finalStats.paidInvoices} paid invoices
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-xs font-medium sm:text-sm">
										Outstanding
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-xl font-bold sm:text-2xl">
										${finalStats.totalOutstanding.toFixed(2)}
									</div>
									<p className="text-xs text-muted-foreground">
										Awaiting payment
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-xs font-medium sm:text-sm">
										Total Invoices
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-xl font-bold sm:text-2xl">
										{finalStats.totalInvoices}
									</div>
									<p className="text-xs text-muted-foreground">All time</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-xs font-medium sm:text-sm">
										Active Clients
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-xl font-bold sm:text-2xl">
										{finalStats.activeClients}
									</div>
									<p className="text-xs text-muted-foreground">Total clients</p>
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
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
									<CardContent className="h-[200px] sm:h-[240px] md:h-[320px] overflow-hidden">
										<div className="flex h-full items-end justify-between gap-1 px-2 sm:px-4 pb-4">
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
									<CardContent className="h-[200px] sm:h-[240px] md:h-[320px] overflow-hidden">
										<div className="flex h-full items-center justify-center">
											<Skeleton className="h-32 w-32 sm:h-48 sm:w-48 rounded-full" />
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
