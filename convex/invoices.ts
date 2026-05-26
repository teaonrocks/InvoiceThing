import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Utility function to round invoice total
function roundToIncrement(value: number, increment: number): number {
	if (increment <= 0) return value;
	return Math.round(value / increment) * increment;
}

type InvoiceTotals = {
	subtotal: number;
	tax: number;
	roundingAdjustment?: number;
	total: number;
};

async function recalculateInvoiceTotals(
	ctx: MutationCtx,
	invoiceId: Id<"invoices">,
	userId: Id<"users">,
	taxRate?: number,
): Promise<InvoiceTotals> {
	const lineItems = await ctx.db
		.query("lineItems")
		.withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
		.collect();

	const claims = await ctx.db
		.query("claims")
		.withIndex("by_invoice", (q) => q.eq("invoiceId", invoiceId))
		.collect();

	const lineSubtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
	const claimsTotal = claims.reduce((sum, claim) => sum + claim.amount, 0);
	const subtotal = lineSubtotal + claimsTotal;

	const settings = await ctx.db
		.query("settings")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.unique();

	const effectiveTaxRate = taxRate ?? settings?.taxRate ?? 0;
	const tax = subtotal * effectiveTaxRate;
	const totalBeforeRounding = subtotal + tax;
	let total = totalBeforeRounding;
	let roundingAdjustment: number | undefined = undefined;

	if (settings?.enableRounding && settings?.roundingIncrement) {
		total = roundToIncrement(total, settings.roundingIncrement);
		roundingAdjustment = total - totalBeforeRounding;
		if (Math.abs(roundingAdjustment) < 0.001) {
			roundingAdjustment = undefined;
		}
	}

	return { subtotal, tax, roundingAdjustment, total };
}

async function patchInvoiceTotals(
	ctx: MutationCtx,
	invoiceId: Id<"invoices">,
	userId: Id<"users">,
	taxRate?: number,
) {
	const totals = await recalculateInvoiceTotals(ctx, invoiceId, userId, taxRate);
	await ctx.db.patch(invoiceId, {
		...totals,
		updatedAt: Date.now(),
	});
	return totals;
}

function normalizeDescription(description: string): string {
	return description.trim().toLowerCase();
}

async function upsertClientLineItemHistory(
	ctx: MutationCtx,
	userId: Id<"users">,
	clientId: Id<"clients">,
	lineItems: Array<{ description: string; unitPrice: number }>,
) {
	const now = Date.now();

	for (const item of lineItems) {
		const description = item.description.trim();
		if (!description || item.unitPrice <= 0) continue;

		const normalizedDescription = normalizeDescription(description);

		const existing = await ctx.db
			.query("clientLineItemHistory")
			.withIndex("by_user_client", (q) =>
				q.eq("userId", userId).eq("clientId", clientId),
			)
			.filter((q) =>
				q.and(
					q.eq(q.field("normalizedDescription"), normalizedDescription),
					q.eq(q.field("unitPrice"), item.unitPrice),
				),
			)
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				description,
				lastUsedAt: now,
				usageCount: existing.usageCount + 1,
				updatedAt: now,
			});
		} else {
			await ctx.db.insert("clientLineItemHistory", {
				userId,
				clientId,
				description,
				unitPrice: item.unitPrice,
				normalizedDescription,
				lastUsedAt: now,
				usageCount: 1,
				createdAt: now,
				updatedAt: now,
			});
		}
	}
}

export const getLineItemHistoryByClient = query({
	args: {
		userId: v.id("users"),
		clientId: v.id("clients"),
	},
	handler: async (ctx, args) => {
		const items = await ctx.db
			.query("clientLineItemHistory")
			.withIndex("by_user_client", (q) =>
				q.eq("userId", args.userId).eq("clientId", args.clientId),
			)
			.collect();

		return items.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
	},
});

// Create a new invoice with line items
export const create = mutation({
	args: {
		userId: v.id("users"),
		clientId: v.id("clients"),
		invoiceNumber: v.string(),
		issueDate: v.number(),
		dueDate: v.number(),
		status: v.union(
			v.literal("draft"),
			v.literal("sent"),
			v.literal("paid"),
			v.literal("overdue")
		),
		notes: v.optional(v.string()),
		lineItems: v.array(
			v.object({
				description: v.string(),
				quantity: v.number(),
				unitPrice: v.number(),
			})
		),
		claims: v.optional(
			v.array(
				v.object({
					description: v.string(),
					amount: v.number(),
					date: v.number(),
					imageStorageId: v.optional(v.id("_storage")),
				})
			)
		),
		taxRate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Get user settings for rounding
		const settings = await ctx.db
			.query("settings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		// Calculate totals from line items
		let subtotal = 0;
		const lineItems = args.lineItems.map((item, index) => {
			const total = item.quantity * item.unitPrice;
			subtotal += total;
			return {
				...item,
				total,
				order: index,
			};
		});

		// Calculate claims total
		let claimsTotal = 0;
		const claims = (args.claims || []).map((claim, index) => {
			claimsTotal += claim.amount;
			return {
				...claim,
				order: index,
			};
		});

		const taxRate = args.taxRate ?? 0;
		const tax = (subtotal + claimsTotal) * taxRate;
		const totalBeforeRounding = subtotal + claimsTotal + tax;
		let total = totalBeforeRounding;
		let roundingAdjustment: number | undefined = undefined;

		// Apply rounding if enabled
		if (settings?.enableRounding && settings?.roundingIncrement) {
			total = roundToIncrement(total, settings.roundingIncrement);
			roundingAdjustment = total - totalBeforeRounding;
			// Only store if there's an actual adjustment
			if (Math.abs(roundingAdjustment) < 0.001) {
				roundingAdjustment = undefined;
			}
		}

		// Create invoice
		const invoiceId = await ctx.db.insert("invoices", {
			userId: args.userId,
			clientId: args.clientId,
			invoiceNumber: args.invoiceNumber,
			issueDate: args.issueDate,
			dueDate: args.dueDate,
			status: args.status,
			subtotal: subtotal + claimsTotal,
			tax,
			roundingAdjustment,
			total,
			notes: args.notes,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		// Create line items
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

		// Create claims
		for (const claim of claims) {
			await ctx.db.insert("claims", {
				invoiceId,
				description: claim.description,
				amount: claim.amount,
				date: claim.date,
				order: claim.order,
				imageStorageId: claim.imageStorageId,
			});
		}

		await upsertClientLineItemHistory(
			ctx,
			args.userId,
			args.clientId,
			args.lineItems.map((item) => ({
				description: item.description,
				unitPrice: item.unitPrice,
			})),
		);

		return invoiceId;
	},
});

// Get all invoices for a user
export const getByUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const invoices = await ctx.db
			.query("invoices")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.collect();

		// Get client info and claim summary for each invoice
		const invoicesWithClients = await Promise.all(
			invoices.map(async (invoice) => {
				const client = await ctx.db.get(invoice.clientId);
				const claims = await ctx.db
					.query("claims")
					.withIndex("by_invoice", (q) => q.eq("invoiceId", invoice._id))
					.collect();
				const claimsCount = claims.length;
				const claimsMissingReceipt = claims.filter(
					(claim) => !claim.imageStorageId,
				).length;
				return {
					...invoice,
					client,
					claimsCount,
					claimsMissingReceipt,
				};
			}),
		);

		return invoicesWithClients;
	},
});

// Get a single invoice with line items and client
export const get = query({
	args: { invoiceId: v.id("invoices") },
	handler: async (ctx, args) => {
		const invoice = await ctx.db.get(args.invoiceId);
		if (!invoice) return null;

		const client = await ctx.db.get(invoice.clientId);
		const lineItems = await ctx.db
			.query("lineItems")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
			.collect();

		const claims = await ctx.db
			.query("claims")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
			.collect();

		// Sort line items and claims by order
		lineItems.sort((a, b) => a.order - b.order);
		claims.sort((a, b) => a.order - b.order);

		return {
			...invoice,
			client,
			lineItems,
			claims,
		};
	},
});

// Update invoice status
export const updateStatus = mutation({
	args: {
		invoiceId: v.id("invoices"),
		status: v.union(
			v.literal("draft"),
			v.literal("sent"),
			v.literal("paid"),
			v.literal("overdue")
		),
	},
	handler: async (ctx, args) => {
		await ctx.db.patch(args.invoiceId, {
			status: args.status,
			updatedAt: Date.now(),
		});
	},
});

export const updateStatusBulk = mutation({
	args: {
		invoiceIds: v.array(v.id("invoices")),
		status: v.union(
			v.literal("draft"),
			v.literal("sent"),
			v.literal("paid"),
			v.literal("overdue")
		),
	},
	handler: async (ctx, args) => {
		if (args.invoiceIds.length === 0) {
			return;
		}

		for (const invoiceId of args.invoiceIds) {
			await ctx.db.patch(invoiceId, {
				status: args.status,
				updatedAt: Date.now(),
			});
		}
	},
});

// Update an invoice with line items
export const update = mutation({
	args: {
		invoiceId: v.id("invoices"),
		userId: v.id("users"),
		clientId: v.id("clients"),
		invoiceNumber: v.string(),
		issueDate: v.number(),
		dueDate: v.number(),
		notes: v.optional(v.string()),
		lineItems: v.array(
			v.object({
				description: v.string(),
				quantity: v.number(),
				unitPrice: v.number(),
			})
		),
		claims: v.optional(
			v.array(
				v.object({
					description: v.string(),
					amount: v.number(),
					date: v.number(),
					imageStorageId: v.optional(v.id("_storage")),
				})
			)
		),
		taxRate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Get user settings for rounding
		const settings = await ctx.db
			.query("settings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		// Calculate totals from line items
		let lineSubtotal = 0;
		const lineItems = args.lineItems.map((item, index) => {
			const total = item.quantity * item.unitPrice;
			lineSubtotal += total;
			return {
				...item,
				total,
				order: index,
			};
		});

		let claimsTotal = 0;
		const claims = (args.claims ?? []).map((claim, index) => {
			claimsTotal += claim.amount;
			return {
				...claim,
				order: index,
			};
		});

		const subtotal = lineSubtotal + claimsTotal;
		const taxRate = args.taxRate ?? 0;
		const tax = subtotal * taxRate;
		const totalBeforeRounding = subtotal + tax;
		let total = totalBeforeRounding;
		let roundingAdjustment: number | undefined = undefined;

		// Apply rounding if enabled
		if (settings?.enableRounding && settings?.roundingIncrement) {
			total = roundToIncrement(total, settings.roundingIncrement);
			roundingAdjustment = total - totalBeforeRounding;
			// Only store if there's an actual adjustment
			if (Math.abs(roundingAdjustment) < 0.001) {
				roundingAdjustment = undefined;
			}
		}

		// Update invoice
		await ctx.db.patch(args.invoiceId, {
			userId: args.userId,
			clientId: args.clientId,
			invoiceNumber: args.invoiceNumber,
			issueDate: args.issueDate,
			dueDate: args.dueDate,
			subtotal,
			tax,
			roundingAdjustment,
			total,
			notes: args.notes,
			updatedAt: Date.now(),
		});

		// Delete existing line items
		const existingLineItems = await ctx.db
			.query("lineItems")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
			.collect();

		for (const item of existingLineItems) {
			await ctx.db.delete(item._id);
		}

		// Delete existing claims
		const existingClaims = await ctx.db
			.query("claims")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
			.collect();

		for (const claim of existingClaims) {
			await ctx.db.delete(claim._id);
		}

		// Create new line items
		for (const item of lineItems) {
			await ctx.db.insert("lineItems", {
				invoiceId: args.invoiceId,
				description: item.description,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				total: item.total,
				order: item.order,
			});
		}

		// Create new claims
		for (const claim of claims) {
			await ctx.db.insert("claims", {
				invoiceId: args.invoiceId,
				description: claim.description,
				amount: claim.amount,
				date: claim.date,
				order: claim.order,
				imageStorageId: claim.imageStorageId,
			});
		}

		await upsertClientLineItemHistory(
			ctx,
			args.userId,
			args.clientId,
			args.lineItems.map((item) => ({
				description: item.description,
				unitPrice: item.unitPrice,
			})),
		);

		return args.invoiceId;
	},
});

// Delete an invoice and its line items
export const remove = mutation({
	args: { invoiceId: v.id("invoices") },
	handler: async (ctx, args) => {
		await deleteInvoiceWithRelations(ctx, args.invoiceId);
	},
});

export const removeMany = mutation({
	args: { invoiceIds: v.array(v.id("invoices")) },
	handler: async (ctx, args) => {
		if (args.invoiceIds.length === 0) {
			return;
		}

		for (const invoiceId of args.invoiceIds) {
			await deleteInvoiceWithRelations(ctx, invoiceId);
		}
	},
});

const deleteInvoiceWithRelations = async (
	ctx: MutationCtx,
	invoiceId: Id<"invoices">
) => {
	const lineItems = await ctx.db.query("lineItems").collect();

	for (const lineItem of lineItems) {
		if (lineItem.invoiceId === invoiceId) {
			await ctx.db.delete(lineItem._id);
		}
	}

	const claims = await ctx.db.query("claims").collect();

	for (const claim of claims) {
		if (claim.invoiceId === invoiceId) {
			await ctx.db.delete(claim._id);
		}
	}

	await ctx.db.delete(invoiceId);
};

// Add a reimbursable expense (claim) to an existing invoice — for mobile quick capture
export const addClaimToInvoice = mutation({
	args: {
		invoiceId: v.id("invoices"),
		description: v.string(),
		amount: v.number(),
		date: v.number(),
		imageStorageId: v.optional(v.id("_storage")),
	},
	handler: async (ctx, args) => {
		const invoice = await ctx.db.get(args.invoiceId);
		if (!invoice) {
			throw new Error("Invoice not found");
		}

		const existingClaims = await ctx.db
			.query("claims")
			.withIndex("by_invoice", (q) => q.eq("invoiceId", args.invoiceId))
			.collect();

		const nextOrder =
			existingClaims.length > 0
				? Math.max(...existingClaims.map((c) => c.order)) + 1
				: 0;

		const claimId = await ctx.db.insert("claims", {
			invoiceId: args.invoiceId,
			description: args.description,
			amount: args.amount,
			date: args.date,
			order: nextOrder,
			imageStorageId: args.imageStorageId,
		});

		await patchInvoiceTotals(ctx, args.invoiceId, invoice.userId);

		return claimId;
	},
});

// Get financial stats for dashboard
export const getStats = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const invoices = await ctx.db
			.query("invoices")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

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
	},
});
