import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const SEED_INVOICE_NUMBERS = [
	"INV-1001",
	"INV-1002",
	"INV-1003",
	"INV-1004",
	"INV-1005",
	"INV-1006",
	"INV-1007",
] as const;

const MOCK_CLIENTS = [
	{
		name: "Northwind Design Co.",
		email: "billing@northwind.example",
		contactPerson: "Alex Morgan",
		streetName: "12 Market Street",
		postalCode: "94105",
	},
	{
		name: "Acme Studio",
		email: "accounts@acme.example",
		contactPerson: "Jordan Lee",
		streetName: "88 Creative Lane",
		postalCode: "10013",
	},
] as const;

type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

type MockInvoice = {
	invoiceNumber: string;
	clientIndex: number;
	status: InvoiceStatus;
	issueDaysAgo: number;
	dueDaysFromIssue: number;
	lineItems: Array<{
		description: string;
		quantity: number;
		unitPrice: number;
	}>;
	notes?: string;
};

const MOCK_INVOICES: MockInvoice[] = [
	{
		invoiceNumber: "INV-1001",
		clientIndex: 0,
		status: "paid",
		issueDaysAgo: 12,
		dueDaysFromIssue: 14,
		lineItems: [
			{ description: "Brand identity refresh", quantity: 1, unitPrice: 2200 },
			{ description: "Social templates pack", quantity: 1, unitPrice: 1000 },
		],
	},
	{
		invoiceNumber: "INV-1002",
		clientIndex: 1,
		status: "sent",
		issueDaysAgo: 9,
		dueDaysFromIssue: 21,
		lineItems: [
			{ description: "Website copywriting", quantity: 12, unitPrice: 250 },
			{ description: "SEO audit", quantity: 1, unitPrice: 1500 },
		],
	},
	{
		invoiceNumber: "INV-1003",
		clientIndex: 0,
		status: "overdue",
		issueDaysAgo: 45,
		dueDaysFromIssue: 14,
		lineItems: [
			{ description: "Monthly retainer", quantity: 1, unitPrice: 2800 },
		],
	},
	{
		invoiceNumber: "INV-1004",
		clientIndex: 1,
		status: "paid",
		issueDaysAgo: 28,
		dueDaysFromIssue: 14,
		lineItems: [
			{ description: "Landing page design", quantity: 1, unitPrice: 1500 },
		],
	},
	{
		invoiceNumber: "INV-1005",
		clientIndex: 0,
		status: "sent",
		issueDaysAgo: 5,
		dueDaysFromIssue: 14,
		lineItems: [
			{ description: "Icon set (24 icons)", quantity: 1, unitPrice: 890 },
		],
	},
	{
		invoiceNumber: "INV-1006",
		clientIndex: 1,
		status: "overdue",
		issueDaysAgo: 38,
		dueDaysFromIssue: 10,
		lineItems: [
			{ description: "Product photography", quantity: 6, unitPrice: 180 },
			{ description: "Retouching", quantity: 1, unitPrice: 220 },
		],
	},
	{
		invoiceNumber: "INV-1007",
		clientIndex: 0,
		status: "draft",
		issueDaysAgo: 1,
		dueDaysFromIssue: 14,
		lineItems: [
			{ description: "Consultation session", quantity: 2, unitPrice: 250 },
		],
	},
];

function daysAgo(days: number): number {
	const date = new Date();
	date.setDate(date.getDate() - days);
	date.setHours(12, 0, 0, 0);
	return date.getTime();
}

function addDays(timestamp: number, days: number): number {
	const date = new Date(timestamp);
	date.setDate(date.getDate() + days);
	return date.getTime();
}

async function hasExistingSeed(ctx: MutationCtx, userId: Id<"users">) {
	const invoices = await ctx.db
		.query("invoices")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	return invoices.some((invoice) =>
		SEED_INVOICE_NUMBERS.includes(
			invoice.invoiceNumber as (typeof SEED_INVOICE_NUMBERS)[number],
		),
	);
}

async function clearExistingSeed(ctx: MutationCtx, userId: Id<"users">) {
	const invoices = await ctx.db
		.query("invoices")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	for (const invoice of invoices) {
		if (
			!SEED_INVOICE_NUMBERS.includes(
				invoice.invoiceNumber as (typeof SEED_INVOICE_NUMBERS)[number],
			)
		) {
			continue;
		}

		const lineItems = await ctx.db
			.query("lineItems")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
			.collect();
		for (const item of lineItems) {
			await ctx.db.delete(item._id);
		}

		const claims = await ctx.db
			.query("claims")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
			.collect();
		for (const claim of claims) {
			await ctx.db.delete(claim._id);
		}

		await ctx.db.delete(invoice._id);
	}

	const clients = await ctx.db
		.query("clients")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	const mockClientNames = new Set<string>(
		MOCK_CLIENTS.map((client) => client.name),
	);

	for (const client of clients) {
		if (!mockClientNames.has(client.name)) continue;

		const remainingInvoices = await ctx.db
			.query("invoices")
			.withIndex("by_client", (q) => q.eq("clientId", client._id))
			.collect();

		if (remainingInvoices.length === 0) {
			await ctx.db.delete(client._id);
		}
	}
}

async function ensureSettings(ctx: MutationCtx, userId: Id<"users">) {
	const existing = await ctx.db
		.query("settings")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.unique();

	const now = Date.now();

	if (existing) {
		await ctx.db.patch(existing._id, {
			invoicePrefix: existing.invoicePrefix || "INV",
			dueDateDays: existing.dueDateDays ?? 14,
			taxRate: existing.taxRate ?? 0,
			updatedAt: now,
		});
		return existing._id;
	}

	return await ctx.db.insert("settings", {
		userId,
		invoicePrefix: "INV",
		invoiceNumberStart: 1008,
		dueDateDays: 14,
		taxRate: 0,
		paymentInstructions: "Pay via bank transfer within 14 days.",
		enableRounding: false,
		roundingIncrement: 0.05,
		createdAt: now,
		updatedAt: now,
	});
}

async function insertMockInvoice(
	ctx: MutationCtx,
	userId: Id<"users">,
	clientId: Id<"clients">,
	invoice: MockInvoice,
) {
	const issueDate = daysAgo(invoice.issueDaysAgo);
	const dueDate = addDays(issueDate, invoice.dueDaysFromIssue);
	const now = Date.now();

	let subtotal = 0;
	const lineItems = invoice.lineItems.map((item, index) => {
		const total = item.quantity * item.unitPrice;
		subtotal += total;
		return { ...item, total, order: index };
	});

	const tax = 0;
	const total = subtotal + tax;

	const invoiceId = await ctx.db.insert("invoices", {
		userId,
		clientId,
		invoiceNumber: invoice.invoiceNumber,
		issueDate,
		dueDate,
		status: invoice.status,
		subtotal,
		tax,
		total,
		notes: invoice.notes,
		createdAt: now,
		updatedAt: now,
	});

	for (const item of lineItems) {
		await ctx.db.insert("lineItems", {
			invoiceId,
			description: item.description,
			quantity: item.quantity,
			unitPrice: item.unitPrice,
			total: item.total,
			order: item.order,
		});
	}

	return invoiceId;
}

export const seedMockDashboardData = internalMutation({
	args: {
		clerkId: v.string(),
		force: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const user = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();

		if (!user) {
			throw new Error(
				`No Convex user found for clerkId "${args.clerkId}". Sign in once so your account is synced, then rerun the seed.`,
			);
		}

		if (!args.force && (await hasExistingSeed(ctx, user._id))) {
			return {
				skipped: true,
				userId: user._id,
				message:
					"Mock dashboard data already exists for this user. Pass { force: true } to replace it.",
			};
		}

		if (args.force) {
			await clearExistingSeed(ctx, user._id);
		}

		const now = Date.now();
		const clientIds: Id<"clients">[] = [];

		for (const client of MOCK_CLIENTS) {
			const clientId = await ctx.db.insert("clients", {
				userId: user._id,
				name: client.name,
				email: client.email,
				contactPerson: client.contactPerson,
				streetName: client.streetName,
				postalCode: client.postalCode,
				createdAt: now,
				updatedAt: now,
			});
			clientIds.push(clientId);
		}

		const invoiceIds: Id<"invoices">[] = [];
		for (const invoice of MOCK_INVOICES) {
			const invoiceId = await insertMockInvoice(
				ctx,
				user._id,
				clientIds[invoice.clientIndex],
				invoice,
			);
			invoiceIds.push(invoiceId);
		}

		await ensureSettings(ctx, user._id);

		return {
			skipped: false,
			userId: user._id,
			clientsCreated: clientIds.length,
			invoicesCreated: invoiceIds.length,
			clientIds,
			invoiceIds,
			message: "Mock dashboard data seeded successfully.",
		};
	},
});
