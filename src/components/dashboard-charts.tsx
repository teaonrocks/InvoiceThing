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
	Legend,
} from "recharts";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
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

type Invoice = Doc<"invoices"> & { client?: Doc<"clients"> | null };

interface DashboardChartsProps {
	invoices: Invoice[];
	isLoading?: boolean;
}

const PAID_COLOR = "var(--status-paid)";
const UNPAID_COLOR = "var(--chart-unpaid)";

const STATUS_CHART_COLORS: Record<InvoiceStatus, string> = {
	paid: "var(--status-paid)",
	sent: "var(--status-sent)",
	draft: "var(--status-draft)",
	overdue: "var(--status-overdue)",
};

function ChartSkeleton() {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card variant="panel" className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Revenue (last 8 weeks)</CardTitle>
					<p className="text-sm text-muted-foreground">
						Total and paid revenue by issue date
					</p>
				</CardHeader>
				<CardContent className="h-[240px] md:h-[280px]">
					<div className="flex h-full items-end justify-between gap-2 pb-2">
						{Array.from({ length: 8 }).map((_, i) => {
							const heights = [45, 52, 38, 60, 48, 55, 42, 58];
							return (
								<div
									key={i}
									className="flex flex-1 flex-col items-center gap-1"
								>
									<div className="flex w-full flex-col justify-end">
										<Skeleton
											className="w-full rounded-t-sm"
											style={{ height: `${(heights[i] || 50) * 2}px` }}
										/>
									</div>
									<Skeleton className="h-3 w-8" />
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>
			<Card variant="panel">
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
	);
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
					if (status !== "draft") {
						totalRevenue += total;
						if (status === "paid") {
							paidRevenue += total;
						}
					}
				}
			});

			const unpaid = Math.max(0, totalRevenue - paidRevenue);

			return {
				week: format(start, "MMM dd"),
				paid: Number(paidRevenue.toFixed(2)),
				unpaid: Number(unpaid.toFixed(2)),
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
				fill: STATUS_CHART_COLORS[status],
			}))
			.filter((item) => item.count > 0);
	}, [invoiceList, invoices]);

	const revenueChartConfig = {
		paid: { label: "Paid amount", color: PAID_COLOR },
		unpaid: { label: "Outstanding", color: UNPAID_COLOR },
	} satisfies ChartConfig;

	if (isLoading) {
		return <ChartSkeleton />;
	}

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card variant="panel" className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Revenue (last 8 weeks)</CardTitle>
					<p className="text-sm text-muted-foreground">
						Total and paid revenue by issue date
					</p>
				</CardHeader>
				<CardContent className="h-[240px] md:h-[280px]">
					<div className="h-full w-full">
						{invoiceList.length ? (
							<ChartContainer
								config={revenueChartConfig}
								className="h-full w-full"
							>
								<BarChart
									data={weeklyRevenueData}
									margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
								>
									<CartesianGrid
										vertical={false}
										stroke="var(--chart-grid)"
										strokeDasharray="0"
									/>
									<XAxis
										dataKey="week"
										tickLine={false}
										axisLine={false}
										tickMargin={10}
										tick={{ fontSize: 12, fill: "var(--chart-tick)" }}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										tickMargin={8}
										tick={{
											fontSize: 12,
											fill: "var(--chart-tick)",
											fontFamily: '"DM Mono", monospace',
										}}
										tickFormatter={(value) => `$${value}`}
										width={48}
									/>
									<ChartTooltip
										content={
											<ChartTooltipContent
												labelFormatter={(label) => label}
												nameKey="dataKey"
												formatter={(value, _name, item) => (
													<div className="flex w-full items-center justify-between gap-4">
														<span className="text-muted-foreground">
															{revenueChartConfig[
																item.dataKey as keyof typeof revenueChartConfig
															]?.label ?? item.dataKey}
														</span>
														<span className="font-number font-medium text-foreground">
															$
															{Number(value).toLocaleString(undefined, {
																maximumFractionDigits: 2,
															})}
														</span>
													</div>
												)}
											/>
										}
									/>
									<Bar
										dataKey="paid"
										stackId="revenue"
										fill={PAID_COLOR}
										radius={[0, 0, 0, 0]}
										maxBarSize={48}
									/>
									<Bar
										dataKey="unpaid"
										stackId="revenue"
										fill={UNPAID_COLOR}
										radius={[4, 4, 0, 0]}
										maxBarSize={48}
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

			<Card variant="panel">
				<CardHeader>
					<CardTitle>Invoice status mix</CardTitle>
					<p className="text-sm text-muted-foreground">
						All invoices grouped by status
					</p>
				</CardHeader>
				<CardContent className="h-[240px] md:h-[280px]">
					<div className="h-full w-full">
						{invoiceList.length ? (
							<ChartContainer
								config={{
									paid: { label: "Paid", color: STATUS_CHART_COLORS.paid },
									sent: { label: "Sent", color: STATUS_CHART_COLORS.sent },
									draft: { label: "Draft", color: STATUS_CHART_COLORS.draft },
									overdue: {
										label: "Overdue",
										color: STATUS_CHART_COLORS.overdue,
									},
								}}
								className="h-full w-full"
							>
								<PieChart>
									<ChartTooltip content={<ChartTooltipContent hideLabel />} />
									<Pie
										data={statusData}
										dataKey="count"
										nameKey="label"
										cx="50%"
										cy="45%"
										outerRadius={72}
										paddingAngle={0}
									>
										{statusData.map((entry) => (
											<Cell key={entry.status} fill={entry.fill} />
										))}
									</Pie>
									<Legend
										verticalAlign="bottom"
										iconType="circle"
										iconSize={8}
										wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
									/>
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
