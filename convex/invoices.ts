import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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
		const total = subtotal + claimsTotal + tax;

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

		// Get client info for each invoice
		const invoicesWithClients = await Promise.all(
			invoices.map(async (invoice) => {
				const client = await ctx.db.get(invoice.clientId);
				return {
					...invoice,
					client,
				};
			})
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
		const total = subtotal + tax;

		// Update invoice
		await ctx.db.patch(args.invoiceId, {
			userId: args.userId,
			clientId: args.clientId,
			invoiceNumber: args.invoiceNumber,
			issueDate: args.issueDate,
			dueDate: args.dueDate,
			subtotal,
			tax,
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

// Get financial stats for dashboard
export const getStats = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const invoices = await ctx.db
			.query("invoices")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		const totalEarnings = invoices
			.filter((inv) => inv.status === "paid")
			.reduce((sum, inv) => sum + inv.total, 0);

		const totalOutstanding = invoices
			.filter((inv) => inv.status === "sent" || inv.status === "overdue")
			.reduce((sum, inv) => sum + inv.total, 0);

		const clients = await ctx.db
			.query("clients")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();

		return {
			totalEarnings,
			totalOutstanding,
			totalInvoices: invoices.length,
			paidInvoices: invoices.filter((inv) => inv.status === "paid").length,
			activeClients: clients.length,
		};
	},
});
