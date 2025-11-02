import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreUser } from "@/hooks/use-store-user";
import { useAppData } from "@/context/app-data-provider";
import { format } from "date-fns";
import {
	BarChart,
	Bar,
	CartesianGrid,
	XAxis,
	YAxis,
	PieChart,
	Pie,
	Cell,
} from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { RecentInvoicesTable } from "@/components/recent-invoices-table";
import { createFileRoute } from "@tanstack/react-router";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
	draft: "Draft",
	sent: "Sent",
	paid: "Paid",
	overdue: "Overdue",
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
	draft: "var(--chart-1)",
	sent: "var(--chart-2)",
	paid: "var(--chart-3)",
	overdue: "var(--chart-4)",
};

export const Route = createFileRoute("/dashboard/")({
	component: DashboardPage,
});

function DashboardPage() {
	// Sync user with Convex on mount
	useStoreUser();

	const { currentUser: convexUser, invoices } = useAppData();

	const stats = useQuery(
		api.invoices.getStats,
		convexUser?._id ? { userId: convexUser._id } : "skip"
	)

	const invoiceList = useMemo(() => invoices ?? [], [invoices]);

	const weeklyRevenueData = useMemo(() => {
		const now = new Date();
		return Array.from({ length: 12 }).map((_, index) => {
			const weekOffset = 11 - index;
			const start = new Date(now);
			start.setDate(start.getDate() - start.getDay() - weekOffset * 7);
			start.setHours(0, 0, 0, 0);
			const end = new Date(start);
			end.setDate(end.getDate() + 7);

			let paidRevenue = 0;
			let totalRevenue = 0;

			invoiceList.forEach((invoice) => {
				const issuedAt =
					typeof invoice.issueDate === "number"
						? invoice.issueDate
						: new Date(invoice.issueDate).getTime();
				const status = invoice.status as InvoiceStatus;
				const total =
					typeof invoice.total === "number"
						? invoice.total
						: Number(invoice.total);

				if (issuedAt >= start.getTime() && issuedAt < end.getTime()) {
					// Exclude drafts from total revenue
					if (status !== "draft") {
						totalRevenue += total;
						if (status === "paid") {
							paidRevenue += total
						}
					}
				}
			})

			return {
				week: format(start, "MMM dd"),
				paid: Number(paidRevenue.toFixed(2)),
				total: Number(totalRevenue.toFixed(2)),
			}
		})
	}, [invoiceList]);

	const statusData = useMemo(() => {
		const counts: Record<InvoiceStatus, number> = {
			draft: 0,
			sent: 0,
			paid: 0,
			overdue: 0,
		}

		invoiceList.forEach((invoice) => {
			const status = invoice.status as InvoiceStatus;
			if (counts[status] !== undefined) {
				counts[status] += 1;
			}
		})

		return (Object.keys(counts) as InvoiceStatus[])
			.map((status) => ({
				status,
				label: STATUS_LABELS[status],
				count: counts[status],
				color: STATUS_COLORS[status],
			}))
			.filter((item) => item.count > 0);
	}, [invoiceList]);

	// Chart configurations
	const revenueChartConfig = {
		total: {
			label: "Total",
			color: "hsl(221 83% 53%)", // Blue (blue-500)
		},
		paid: {
			label: "Paid",
			color: "hsl(142 71% 45%)", // Green (green-500)
		},
	} satisfies ChartConfig;

	const statusChartConfig = {
		draft: {
			label: "Draft",
			color: "var(--muted-foreground)", // Gray
		},
		sent: {
			label: "Sent",
			color: "hsl(221 83% 53%)", // Blue (blue-500)
		},
		paid: {
			label: "Paid",
			color: "hsl(142 71% 45%)", // Green (green-500)
		},
		overdue: {
			label: "Overdue",
			color: "hsl(0 84% 60%)", // Red (red-500)
		},
	} satisfies ChartConfig;

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container mx-auto px-4 py-4 sm:py-8">
				<h1 className="mb-8 text-3xl font-bold sm:text-4xl">Dashboard</h1>

				{!convexUser && (
					<div className="text-muted-foreground">Loading your dashboard...</div>
				)}

				{convexUser && (
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
										<p className="text-xs text-muted-foreground">
											Total clients
										</p>
									</CardContent>
								</Card>
							</div>
						) : (
							<div className="text-sm text-muted-foreground">
								Loading key metrics...
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
								<RecentInvoicesTable invoices={invoiceList} />
							</CardContent>
						</Card>

						<div className="grid gap-4 lg:grid-cols-3">
							<Card className="lg:col-span-2">
								<CardHeader>
									<CardTitle>Revenue (last 12 weeks)</CardTitle>
									<p className="text-sm text-muted-foreground">
										Total and paid revenue by issue date
									</p>
								</CardHeader>
								<CardContent className="h-[240px] sm:h-[320px]">
									{invoiceList.length ? (
										<ChartContainer
											config={revenueChartConfig}
											className="h-full w-full"
										>
											<BarChart
												accessibilityLayer
												data={weeklyRevenueData}
												margin={{ top: 16, right: 16, left: 8, bottom: 16 }}
											>
												<CartesianGrid vertical={false} />
												<XAxis
													dataKey="week"
													tickLine={false}
													tickMargin={10}
													axisLine={false}
													tickFormatter={(value) => value.slice(0, 3)}
												/>
												<YAxis
													tickLine={false}
													axisLine={false}
													tickMargin={8}
													tickFormatter={(value) => "$${value}"}
												/>
												<ChartTooltip
													content={
														<ChartTooltipContent
															formatter={(value) =>
																`$${Number(value).toLocaleString(undefined, {
																	maximumFractionDigits: 2,
																})}`
															}
														/>
													}
												/>
												<Bar
													dataKey="total"
													fill="var(--color-total)"
													radius={[6, 6, 0, 0]}
												/>
												<Bar
													dataKey="paid"
													fill="var(--color-paid)"
													radius={[6, 6, 0, 0]}
												/>
											</BarChart>
										</ChartContainer>
									) : (
										<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
											Create an invoice to see revenue trends.
										</div>
									)}
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
									{invoiceList.length ? (
										<ChartContainer
											config={statusChartConfig}
											className="h-full w-full"
										>
											<PieChart>
												<ChartTooltip
													content={<ChartTooltipContent hideLabel />}
												/>
												<Pie
													data={statusData}
													dataKey="count"
													nameKey="status"
													innerRadius={60}
													outerRadius={100}
													paddingAngle={statusData.length > 1 ? 4 : 0}
													startAngle={0}
													endAngle={360}
													label
												>
													{statusData.map((entry) => (
														<Cell
															key={entry.status}
															fill={"var(--color-${entry.status})"}
														/>
													))}
												</Pie>
											</PieChart>
										</ChartContainer>
									) : (
										<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
											No invoices yet.
										</div>
									)}
								</CardContent>
							</Card>
						</div>
					</div>
				)}
			</main>
		</div>
	)
}

