import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

function normalizeField(value: string | undefined | null) {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function normalizeClientAddress(args: {
	streetName?: string | null;
	buildingName?: string | null;
	unitNumber?: string | null;
	postalCode?: string | null;
}) {
	return {
		streetName: normalizeField(args.streetName ?? undefined),
		buildingName: normalizeField(args.buildingName ?? undefined),
		unitNumber: normalizeField(args.unitNumber ?? undefined),
		postalCode: normalizeField(args.postalCode ?? undefined),
	};
}

// Create a new client
export const create = mutation({
	args: {
		userId: v.id("users"),
		name: v.string(),
		email: v.optional(v.string()),
		streetName: v.optional(v.string()),
		buildingName: v.optional(v.string()),
		unitNumber: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		contactPerson: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const normalizedAddress = normalizeClientAddress(args);
		const clientId = await ctx.db.insert("clients", {
			userId: args.userId,
			name: args.name,
			email: args.email,
			contactPerson: args.contactPerson,
			createdAt: Date.now(),
			updatedAt: Date.now(),
			...normalizedAddress,
		});
		return clientId;
	},
});

// Get all clients for a user
export const getByUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("clients")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.collect();
	},
});

// Get a single client
export const get = query({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.clientId);
	},
});

// Update a client
export const update = mutation({
	args: {
		clientId: v.id("clients"),
		name: v.optional(v.string()),
		email: v.optional(v.string()),
		streetName: v.optional(v.string()),
		buildingName: v.optional(v.string()),
		unitNumber: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		contactPerson: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { clientId, ...updates } = args;
		const normalizedAddress = normalizeClientAddress(updates);
		await ctx.db.patch(clientId, {
			...updates,
			...normalizedAddress,
			updatedAt: Date.now(),
		});
	},
});

// Delete a client
export const remove = mutation({
	args: { clientId: v.id("clients") },
	handler: async (ctx, args) => {
		await ctx.db.delete(args.clientId);
	},
});
