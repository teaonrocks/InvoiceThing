import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get user settings (creates default if not exists)
export const get = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const settings = await ctx.db
			.query("settings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		// If no settings exist, return defaults
		if (!settings) {
			return {
				userId: args.userId,
				invoicePrefix: "INV",
				invoiceNumberStart: 1,
				dueDateDays: 14,
				taxRate: 0,
				paymentInstructions: undefined,
			};
		}

		return settings;
	},
});

// Initialize or update settings
export const upsert = mutation({
	args: {
		userId: v.id("users"),
		invoicePrefix: v.optional(v.string()),
		invoiceNumberStart: v.optional(v.number()),
		dueDateDays: v.optional(v.number()),
		taxRate: v.optional(v.number()),
		paymentInstructions: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("settings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		const updates = {
			invoicePrefix: args.invoicePrefix,
			invoiceNumberStart: args.invoiceNumberStart,
			dueDateDays: args.dueDateDays,
			taxRate: args.taxRate,
			paymentInstructions: args.paymentInstructions,
		};

		if (existing) {
			// Update existing settings
			await ctx.db.patch(existing._id, {
				...updates,
				updatedAt: Date.now(),
			});
			return existing._id;
		} else {
			// Create new settings with defaults
			const settingsId = await ctx.db.insert("settings", {
				userId: args.userId,
				invoicePrefix: args.invoicePrefix ?? "INV",
				invoiceNumberStart: args.invoiceNumberStart ?? 1,
				dueDateDays: args.dueDateDays ?? 14,
				taxRate: args.taxRate ?? 0,
				paymentInstructions: args.paymentInstructions,
				createdAt: Date.now(),
				updatedAt: Date.now(),
			});
			return settingsId;
		}
	},
});

// Get next invoice number
export const getNextInvoiceNumber = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		const settings = await ctx.db
			.query("settings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		const prefix = settings?.invoicePrefix ?? "INV";

		// Get the latest invoice for this user
		const invoices = await ctx.db
			.query("invoices")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.order("desc")
			.take(1);

		if (invoices.length === 0) {
			// No invoices yet, use start number
			const startNumber = settings?.invoiceNumberStart ?? 1;
			return `${prefix}-${String(startNumber).padStart(4, "0")}`;
		}

		// Extract number from last invoice and increment
		const lastInvoice = invoices[0];
		const parts = lastInvoice.invoiceNumber.split("-");
		const lastNumberStr = parts[parts.length - 1] || "0";
		const lastNumber = parseInt(lastNumberStr, 10);

		// If parsing fails, start from the beginning
		if (isNaN(lastNumber)) {
			const startNumber = settings?.invoiceNumberStart ?? 1;
			return `${prefix}-${String(startNumber).padStart(4, "0")}`;
		}

		const nextNumber = lastNumber + 1;
		return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
	},
});
