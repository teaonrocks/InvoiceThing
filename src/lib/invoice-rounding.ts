export function roundToIncrement(value: number, increment: number): number {
	if (increment <= 0) return value;
	return Math.round(value / increment) * increment;
}

export type InvoiceRoundingSettings = {
	enableRounding?: boolean;
	roundingIncrement?: number;
};

/** Matches server-side rounding in convex/invoices.ts */
export function applyInvoiceTotalRounding(
	totalBeforeRounding: number,
	settings?: InvoiceRoundingSettings,
): { total: number; roundingAdjustment?: number } {
	let total = totalBeforeRounding;
	let roundingAdjustment: number | undefined;

	if (settings?.enableRounding && settings.roundingIncrement) {
		total = roundToIncrement(total, settings.roundingIncrement);
		roundingAdjustment = total - totalBeforeRounding;
		if (Math.abs(roundingAdjustment) < 0.001) {
			roundingAdjustment = undefined;
		}
	}

	return { total, roundingAdjustment };
}
