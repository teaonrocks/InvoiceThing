import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

function normalizeDescription(description: string): string {
	return description.trim().toLowerCase();
}

type HistoryAggregate = {
	userId: Id<"users">;
	clientId: Id<"clients">;
	description: string;
	unitPrice: number;
	normalizedDescription: string;
	usageCount: number;
	lastUsedAt: number;
	createdAt: number;
};

export const backfillClientLineItemHistory = internalMutation({
	args: {
		force: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const invoices = await ctx.db.query("invoices").collect();
		const invoiceById = new Map(invoices.map((invoice) => [invoice._id, invoice]));
		const lineItems = await ctx.db.query("lineItems").collect();

		const aggregates = new Map<string, HistoryAggregate>();

		for (const item of lineItems) {
			const invoice = invoiceById.get(item.invoiceId);
			if (!invoice) continue;

			const description = item.description.trim();
			if (!description || item.unitPrice <= 0) continue;

			const normalizedDescription = normalizeDescription(description);
			const key = `${invoice.userId}|${invoice.clientId}|${normalizedDescription}|${item.unitPrice}`;
			const usedAt = Math.max(invoice.updatedAt, invoice.issueDate);

			const existing = aggregates.get(key);
			if (existing) {
				existing.usageCount += 1;
				if (usedAt >= existing.lastUsedAt) {
					existing.lastUsedAt = usedAt;
					existing.description = description;
				}
				if (usedAt < existing.createdAt) {
					existing.createdAt = usedAt;
				}
			} else {
				aggregates.set(key, {
					userId: invoice.userId,
					clientId: invoice.clientId,
					description,
					unitPrice: item.unitPrice,
					normalizedDescription,
					usageCount: 1,
					lastUsedAt: usedAt,
					createdAt: usedAt,
				});
			}
		}

		let inserted = 0;
		let updated = 0;

		for (const entry of aggregates.values()) {
			const existing = await ctx.db
				.query("clientLineItemHistory")
				.withIndex("by_user_client", (q) =>
					q.eq("userId", entry.userId).eq("clientId", entry.clientId),
				)
				.filter((q) =>
					q.and(
						q.eq(q.field("normalizedDescription"), entry.normalizedDescription),
						q.eq(q.field("unitPrice"), entry.unitPrice),
					),
				)
				.first();

			if (existing) {
				await ctx.db.patch(existing._id, {
					description: entry.description,
					usageCount: entry.usageCount,
					lastUsedAt: entry.lastUsedAt,
					updatedAt: Date.now(),
				});
				updated += 1;
			} else {
				await ctx.db.insert("clientLineItemHistory", {
					userId: entry.userId,
					clientId: entry.clientId,
					description: entry.description,
					unitPrice: entry.unitPrice,
					normalizedDescription: entry.normalizedDescription,
					usageCount: entry.usageCount,
					lastUsedAt: entry.lastUsedAt,
					createdAt: entry.createdAt,
					updatedAt: entry.lastUsedAt,
				});
				inserted += 1;
			}
		}

		let removed = 0;

		if (args.force) {
			const aggregateKeys = new Set(aggregates.keys());
			const historyRows = await ctx.db.query("clientLineItemHistory").collect();

			for (const row of historyRows) {
				const key = `${row.userId}|${row.clientId}|${row.normalizedDescription}|${row.unitPrice}`;
				if (!aggregateKeys.has(key)) {
					await ctx.db.delete(row._id);
					removed += 1;
				}
			}
		}

		return {
			invoicesProcessed: invoices.length,
			lineItemsProcessed: lineItems.length,
			historyRowsInserted: inserted,
			historyRowsUpdated: updated,
			historyRowsRemoved: removed,
			totalHistoryRows: aggregates.size,
			message: "Client line item history backfill completed.",
		};
	},
});
