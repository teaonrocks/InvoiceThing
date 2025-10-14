import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// Users table - linked with Clerk
	users: defineTable({
		clerkId: v.string(),
		email: v.string(),
		name: v.optional(v.string()),
		imageUrl: v.optional(v.string()),
		createdAt: v.number(),
	}).index("by_clerk_id", ["clerkId"]),

	// Clients table
	clients: defineTable({
		userId: v.id("users"),
		name: v.string(),
		email: v.optional(v.string()),
		streetName: v.optional(v.string()),
		buildingName: v.optional(v.string()),
		unitNumber: v.optional(v.string()),
		postalCode: v.optional(v.string()),
		contactPerson: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	// Invoices table
	invoices: defineTable({
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
		subtotal: v.number(),
		tax: v.number(),
		total: v.number(),
		notes: v.optional(v.string()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_client", ["clientId"])
		.index("by_invoice_number", ["invoiceNumber"]),

	// Invoice line items table
	lineItems: defineTable({
		invoiceId: v.id("invoices"),
		description: v.string(),
		quantity: v.number(),
		unitPrice: v.number(),
		total: v.number(),
		order: v.number(), // For ordering line items
	}).index("by_invoice", ["invoiceId"]),

	// Invoice claims/expenses table
	claims: defineTable({
		invoiceId: v.id("invoices"),
		description: v.string(),
		amount: v.number(),
		date: v.number(), // Timestamp of when the expense occurred
		order: v.number(), // For ordering claims
		imageStorageId: v.optional(v.id("_storage")), // Optional receipt image
	}).index("by_invoice", ["invoiceId"]),

	// User settings table
	settings: defineTable({
		userId: v.id("users"),
		invoicePrefix: v.string(), // e.g., "INV"
		invoiceNumberStart: v.number(), // Starting number for auto-generation
		dueDateDays: v.number(), // Default days from issue date to due date
		taxRate: v.number(), // Default tax rate (e.g., 0.1 for 10%)
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),
});
