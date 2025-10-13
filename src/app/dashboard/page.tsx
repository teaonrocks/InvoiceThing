"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreUser } from "@/hooks/use-store-user";
import { useAppData } from "@/context/app-data-provider";
import { format } from "date-fns";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip as RechartsTooltip,
	Legend,
	PieChart,
	Pie,
	Cell,
} from "recharts";

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

const STATUS_LABELS: Record<InvoiceStatus, string> = {
	draft: "Draft",
	sent: "Sent",
	paid: "Paid",
	overdue: "Overdue",
};

const STATUS_COLORS: Record<InvoiceStatus, string> = {
	draft: "#9CA3AF",
	sent: "#3B82F6",
	paid: "#10B981",
	overdue: "#EF4444",
};

export default function DashboardPage() {
	// Sync user with Convex on mount
	useStoreUser();

	const { currentUser: convexUser, invoices } = useAppData();

	const stats = useQuery(
		api.invoices.getStats,
		convexUser?._id ? { userId: convexUser._id } : "skip"
	);

	const invoiceList = useMemo(() => invoices ?? [], [invoices]);

	const monthlyRevenueData = useMemo(() => {
		const now = new Date();
		return Array.from({ length: 6 }).map((_, index) => {
			const monthOffset = 5 - index;
			const current = new Date(
				now.getFullYear(),
				now.getMonth() - monthOffset,
				1
			);
			const start = new Date(
				current.getFullYear(),
				current.getMonth(),
				1
			).getTime();
			const end = new Date(
				current.getFullYear(),
				current.getMonth() + 1,
				1
			).getTime();

			const revenue = invoiceList.reduce((sum, invoice) => {
				const issuedAt =
					typeof invoice.issueDate === "number"
						? invoice.issueDate
						: new Date(invoice.issueDate).getTime();
				const status = invoice.status as InvoiceStatus;

				if (status === "paid" && issuedAt >= start && issuedAt < end) {
					return (
						sum +
						(typeof invoice.total === "number"
							? invoice.total
							: Number(invoice.total))
					);
				}

				return sum;
			}, 0);

			return {
				month: format(current, "MMM yyyy"),
				revenue: Number(revenue.toFixed(2)),
			};
		});
	}, [invoiceList]);

	const statusData = useMemo(() => {
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

		return (Object.keys(counts) as InvoiceStatus[]).map((status) => ({
			status,
			label: STATUS_LABELS[status],
			count: counts[status],
			color: STATUS_COLORS[status],
		}));
	}, [invoiceList]);

	const topClientsData = useMemo(() => {
		const totals = new Map<string, { name: string; value: number }>();
		invoiceList.forEach((invoice) => {
			const key = (invoice.clientId as string | undefined) ?? invoice._id;
			const name = invoice.client?.name ?? "Unnamed Client";
			const value =
				typeof invoice.total === "number"
					? invoice.total
					: Number(invoice.total);
			const current = totals.get(key) ?? { name, value: 0 };
			current.value += value;
			totals.set(key, current);
		});

		return Array.from(totals.values())
			.sort((a, b) => b.value - a.value)
			.slice(0, 5)
			.map((item) => ({
				name: item.name,
				value: Number(item.value.toFixed(2)),
			}));
	}, [invoiceList]);

	const tooltipStyle = {
		backgroundColor: "var(--background)",
		borderRadius: "0.5rem",
		border: "1px solid var(--border)",
		color: "var(--foreground)",
		fontSize: "0.75rem",
		padding: "0.5rem 0.75rem",
	};

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container mx-auto px-4 py-8">
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

							<div className="grid gap-4 lg:grid-cols-3">
								<Card className="lg:col-span-2">
								<CardHeader>
									<CardTitle>Revenue (last 6 months)</CardTitle>
									<p className="text-sm text-muted-foreground">
										Paid invoices by issue date
									</p>
								</CardHeader>
									<CardContent className="h-[240px] sm:h-[320px]">
									{invoiceList.length ? (
										<ResponsiveContainer width="100%" height="100%">
											<BarChart
												data={monthlyRevenueData}
												margin={{ top: 16, right: 16, left: 8, bottom: 16 }}
											>
												<CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
												<XAxis
													dataKey="month"
													axisLine={false}
													tickLine={false}
													style={{
														fontSize: "0.75rem",
														fill: "var(--muted-foreground)",
													}}
												/>
												<YAxis
													axisLine={false}
													tickLine={false}
													style={{
														fontSize: "0.75rem",
														fill: "var(--muted-foreground)",
													}}
													tickFormatter={(value) => `$${value}`}
												/>
												<RechartsTooltip
													contentStyle={tooltipStyle}
													formatter={(value: number) => [
														`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
														"Revenue",
													]}
												/>
												<Bar
													dataKey="revenue"
													fill="hsl(var(--primary))"
													radius={[6, 6, 6, 6]}
												/>
											</BarChart>
										</ResponsiveContainer>
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
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={statusData}
													dataKey="count"
													nameKey="label"
													innerRadius={60}
													outerRadius={100}
													paddingAngle={4}
												>
													{statusData.map((entry) => (
														<Cell key={entry.status} fill={entry.color} />
													))}
												</Pie>
												<RechartsTooltip
													contentStyle={tooltipStyle}
													formatter={(value: number, _name, entry) => [
														value,
														entry?.payload?.label ?? "",
													]}
												/>
												<Legend
													verticalAlign="bottom"
													iconType="circle"
													wrapperStyle={{
														fontSize: "0.75rem",
														color: "var(--muted-foreground)",
													}}
												/>
											</PieChart>
										</ResponsiveContainer>
									) : (
										<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
											No invoices yet.
										</div>
									)}
								</CardContent>
							</Card>
						</div>

							<Card>
							<CardHeader>
								<CardTitle>Top clients by billed amount</CardTitle>
								<p className="text-sm text-muted-foreground">
									Based on all invoices
								</p>
							</CardHeader>
								<CardContent className="h-[240px] sm:h-[320px]">
								{topClientsData.length ? (
									<ResponsiveContainer width="100%" height="100%">
										<BarChart
											data={topClientsData}
											layout="vertical"
											margin={{ top: 16, right: 16, left: 32, bottom: 16 }}
										>
											<CartesianGrid strokeDasharray="4 4" stroke="#E5E7EB" />
											<XAxis
												type="number"
												axisLine={false}
												tickLine={false}
												style={{
													fontSize: "0.75rem",
													fill: "var(--muted-foreground)",
												}}
												tickFormatter={(value) => `$${value}`}
											/>
											<YAxis
												dataKey="name"
												type="category"
												axisLine={false}
												tickLine={false}
												width={140}
												style={{
													fontSize: "0.75rem",
													fill: "var(--muted-foreground)",
												}}
											/>
											<RechartsTooltip
												contentStyle={tooltipStyle}
												formatter={(value: number) => [
													`$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
													"Billed",
												]}
											/>
											<Bar
												dataKey="value"
												fill="hsl(var(--primary))"
												radius={[6, 6, 6, 6]}
												maxBarSize={32}
											/>
										</BarChart>
									</ResponsiveContainer>
								) : (
									<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
										No client billing data yet.
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				)}
			</main>
		</div>
	);
}
