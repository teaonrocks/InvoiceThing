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
				enableRounding: false,
				roundingIncrement: 0.05,
				logoStorageId: undefined,
				invoiceAccentColor: undefined,
				invoiceSecondaryColor: undefined,
				invoiceFontFamily: undefined,
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
		enableRounding: v.optional(v.boolean()),
		roundingIncrement: v.optional(v.number()),
		logoStorageId: v.optional(v.id("_storage")),
		invoiceAccentColor: v.optional(v.string()),
		invoiceSecondaryColor: v.optional(v.string()),
		invoiceFontFamily: v.optional(v.string()),
		clearLogo: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("settings")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();

		const updates: Record<string, unknown> = {
			invoicePrefix: args.invoicePrefix,
			invoiceNumberStart: args.invoiceNumberStart,
			dueDateDays: args.dueDateDays,
			taxRate: args.taxRate,
			paymentInstructions: args.paymentInstructions,
			enableRounding: args.enableRounding,
			roundingIncrement: args.roundingIncrement,
			invoiceAccentColor: args.invoiceAccentColor,
			invoiceSecondaryColor: args.invoiceSecondaryColor,
			invoiceFontFamily: args.invoiceFontFamily,
		};

		if (args.logoStorageId !== undefined) {
			updates.logoStorageId = args.logoStorageId;
		} else if (args.clearLogo) {
			updates.logoStorageId = undefined;
		}

		if (existing) {
			await ctx.db.patch(existing._id, {
				...updates,
				updatedAt: Date.now(),
			});
			return existing._id;
		}

		const settingsId = await ctx.db.insert("settings", {
			userId: args.userId,
			invoicePrefix: args.invoicePrefix ?? "INV",
			invoiceNumberStart: args.invoiceNumberStart ?? 1,
			dueDateDays: args.dueDateDays ?? 14,
			taxRate: args.taxRate ?? 0,
			paymentInstructions: args.paymentInstructions,
			enableRounding: args.enableRounding ?? false,
			roundingIncrement: args.roundingIncrement ?? 0.05,
			logoStorageId: args.clearLogo ? undefined : args.logoStorageId,
			invoiceAccentColor: args.invoiceAccentColor,
			invoiceSecondaryColor: args.invoiceSecondaryColor,
			invoiceFontFamily: args.invoiceFontFamily,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});
		return settingsId;
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
