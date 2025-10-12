import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new client
export const create = mutation({
	args: {
		userId: v.id("users"),
		name: v.string(),
		email: v.optional(v.string()),
		address: v.optional(v.string()),
		contactPerson: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const clientId = await ctx.db.insert("clients", {
			userId: args.userId,
			name: args.name,
			email: args.email,
			address: args.address,
			contactPerson: args.contactPerson,
			createdAt: Date.now(),
			updatedAt: Date.now(),
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
		address: v.optional(v.string()),
		contactPerson: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { clientId, ...updates } = args;
		await ctx.db.patch(clientId, {
			...updates,
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
