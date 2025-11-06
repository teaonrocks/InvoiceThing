import { useMemo } from "react";
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
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Doc } from "@/../convex/_generated/dataModel";

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

type Invoice = Doc<"invoices"> & { client?: Doc<"clients"> | null };

interface DashboardChartsProps {
	invoices: Invoice[];
	isLoading?: boolean;
}

export function DashboardCharts({ invoices, isLoading }: DashboardChartsProps) {
	const invoiceList = useMemo(() => invoices ?? [], [invoices]);

	const weeklyRevenueData = useMemo(() => {
		if (!invoices || invoices.length === 0) return [];
		const now = new Date();
		return Array.from({ length: 8 }).map((_, index) => {
			const weekOffset = 7 - index;
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
							paidRevenue += total;
						}
					}
				}
			});

			return {
				week: format(start, "MMM dd"),
				paid: Number(paidRevenue.toFixed(2)),
				total: Number(totalRevenue.toFixed(2)),
			};
		});
	}, [invoiceList, invoices]);

	const statusData = useMemo(() => {
		if (!invoices || invoices.length === 0) return [];
		const counts: Record<InvoiceStatus, number> = {
			draft: 0,
			sent: 0,
			paid: 0,
			overdue: 0,
		};

		invoiceList.forEach((invoice) => {
			const status = invoice.status as InvoiceStatus;
			if (counts[status] !== undefined) {
				counts[status] += 1;
			}
		});

		return (Object.keys(counts) as InvoiceStatus[])
			.map((status) => ({
				status,
				label: STATUS_LABELS[status],
				count: counts[status],
				color: STATUS_COLORS[status],
			}))
			.filter((item) => item.count > 0);
	}, [invoiceList, invoices]);

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

	// Show skeleton while loading - AFTER all hooks are called
	if (isLoading) {
		return (
			<div className="grid gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Revenue (last 8 weeks)</CardTitle>
						<p className="text-sm text-muted-foreground">
							Total and paid revenue by issue date
						</p>
					</CardHeader>
					<CardContent className="h-[200px] sm:h-[240px] md:h-[320px] overflow-hidden">
						<div className="-mx-6 px-6 md:mx-0 md:px-0 h-full flex items-end justify-between gap-1 pb-4">
							{Array.from({ length: 8 }).map((_, i) => {
								const heights = [45, 52, 38, 60, 48, 55, 42, 58];
								const paidHeights = [30, 35, 25, 40, 32, 38, 28, 42];
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
						<div className="-mx-6 px-6 md:mx-0 md:px-0 h-full flex items-center justify-center">
							<Skeleton className="h-32 w-32 sm:h-48 sm:w-48 rounded-full" />
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Revenue (last 8 weeks)</CardTitle>
					<p className="text-sm text-muted-foreground">
						Total and paid revenue by issue date
					</p>
				</CardHeader>
				<CardContent className="h-[200px] sm:h-[240px] md:h-[320px] overflow-hidden">
					<div className="-mx-6 px-6 md:mx-0 md:px-0 h-full w-full max-w-full overflow-hidden">
						{invoiceList.length ? (
							<ChartContainer
								config={revenueChartConfig}
								className="h-full w-full min-w-0 max-w-full"
							>
								<BarChart
									accessibilityLayer
									data={weeklyRevenueData}
									margin={{ top: 8, right: 0, left: 0, bottom: 32 }}
									style={{ width: "100%", height: "100%" }}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="week"
										tickLine={false}
										tickMargin={6}
										axisLine={false}
										tickFormatter={(value) => value.slice(0, 3)}
										style={{ fontSize: "10px" }}
										className="sm:text-xs"
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tickMargin={4}
										tickFormatter={(value) => `$${value}`}
										style={{ fontSize: "10px" }}
										className="sm:text-xs"
										width={35}
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
									<ChartLegend
										content={<ChartLegendContent nameKey="dataKey" />}
										className="-translate-y-1 text-xs"
									/>
									<Bar
										dataKey="total"
										fill="var(--color-total)"
										radius={[4, 4, 0, 0]}
									/>
									<Bar
										dataKey="paid"
										fill="var(--color-paid)"
										radius={[4, 4, 0, 0]}
									/>
								</BarChart>
							</ChartContainer>
						) : (
							<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
								Create an invoice to see revenue trends.
							</div>
						)}
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
					<div className="-mx-6 px-6 md:mx-0 md:px-0 h-full w-full max-w-full overflow-hidden">
						{invoiceList.length ? (
							<ChartContainer
								config={statusChartConfig}
								className="h-full w-full min-w-0 max-w-full"
							>
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent hideLabel />} />
									<ChartLegend
										content={<ChartLegendContent nameKey="status" />}
										className="-translate-y-1 text-xs"
									/>
									<Pie
										data={statusData}
										dataKey="count"
										nameKey="status"
										innerRadius={25}
										outerRadius={50}
										paddingAngle={statusData.length > 1 ? 4 : 0}
										startAngle={0}
										endAngle={360}
										label
									>
										{statusData.map((entry) => (
											<Cell
												key={entry.status}
												fill={`var(--color-${entry.status})`}
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
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
