import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { buildInvoiceBranding, type InvoiceBranding } from "@/lib/invoice-branding";

export function useInvoiceSettingsBranding(
	userId: Id<"users"> | undefined,
): InvoiceBranding | undefined {
	const settings = useQuery(
		api.settings.get,
		userId ? { userId } : "skip",
	);
	const logoUrl = useQuery(
		api.files.getFileUrl,
		settings?.logoStorageId
			? { storageId: settings.logoStorageId }
			: "skip",
	);

	if (!settings) return undefined;

	return buildInvoiceBranding(settings, logoUrl ?? undefined);
}
