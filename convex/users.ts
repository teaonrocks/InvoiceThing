import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update user from Clerk webhook
export const store = mutation({
	args: {
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const existingUser = await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();

		if (existingUser) {
			// Update existing user
			await ctx.db.patch(existingUser._id, {
				email: args.email,
				name: args.name,
				imageUrl: args.imageUrl,
			});
			return existingUser._id;
		}

		// Create new user
		const userId = await ctx.db.insert("users", {
			clerkId: args.clerkId,
			email: args.email,
			name: args.name,
			imageUrl: args.imageUrl,
			createdAt: Date.now(),
		});

		return userId;
	},
});

// Get current user by Clerk ID
export const getCurrentUser = query({
	args: { clerkId: v.string() },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("users")
			.withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
			.unique();
	},
});

// Get user by ID
export const getUser = query({
	args: { userId: v.id("users") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.userId);
	},
});
