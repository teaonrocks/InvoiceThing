type Rgb = { r: number; g: number; b: number };

export function parseHexColor(hex: string): Rgb | null {
	const normalized = hex.trim();
	const match = /^#?([0-9a-fA-F]{6})$/.exec(normalized);
	if (!match) return null;

	const value = match[1];
	return {
		r: parseInt(value.slice(0, 2), 16),
		g: parseInt(value.slice(2, 4), 16),
		b: parseInt(value.slice(4, 6), 16),
	};
}

export function rgbToHex({ r, g, b }: Rgb): string {
	return `#${[r, g, b]
		.map((channel) =>
			Math.round(Math.max(0, Math.min(255, channel)))
				.toString(16)
				.padStart(2, "0"),
		)
		.join("")}`.toUpperCase();
}

function srgbToLinear(channel: number): number {
	const value = channel / 255;
	return value <= 0.03928
		? value / 12.92
		: ((value + 0.055) / 1.055) ** 2.4;
}

export function getRelativeLuminance(hex: string): number {
	const rgb = parseHexColor(hex);
	if (!rgb) return 0;

	const r = srgbToLinear(rgb.r);
	const g = srgbToLinear(rgb.g);
	const b = srgbToLinear(rgb.b);
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(foreground: string, background: string): number {
	const foregroundLuminance = getRelativeLuminance(foreground);
	const backgroundLuminance = getRelativeLuminance(background);
	const lighter = Math.max(foregroundLuminance, backgroundLuminance);
	const darker = Math.min(foregroundLuminance, backgroundLuminance);
	return (lighter + 0.05) / (darker + 0.05);
}

function mixRgb(source: Rgb, target: Rgb, weight: number): Rgb {
	const amount = Math.max(0, Math.min(1, weight));
	return {
		r: source.r * (1 - amount) + target.r * amount,
		g: source.g * (1 - amount) + target.g * amount,
		b: source.b * (1 - amount) + target.b * amount,
	};
}

export function ensureContrast(
	foreground: string,
	background: string,
	minRatio = 4.5,
): string {
	const parsedForeground = parseHexColor(foreground);
	const parsedBackground = parseHexColor(background);
	if (!parsedForeground || !parsedBackground) return foreground;

	let current = parsedForeground;
	let currentHex = rgbToHex(current);
	if (getContrastRatio(currentHex, background) >= minRatio) {
		return currentHex;
	}

	const target: Rgb =
		getRelativeLuminance(background) > 0.179
			? { r: 0, g: 0, b: 0 }
			: { r: 255, g: 255, b: 255 };

	for (let step = 1; step <= 20; step++) {
		current = mixRgb(current, target, 0.08);
		currentHex = rgbToHex(current);
		if (getContrastRatio(currentHex, background) >= minRatio) {
			return currentHex;
		}
	}

	return rgbToHex(target);
}

export type InvoiceTextColors = {
	foreground: string;
	mutedForeground: string;
	accent: string;
	border: string;
};

export function getInvoiceTextColors(
	accentColor: string,
	secondaryColor: string,
): InvoiceTextColors {
	const isLightBackground = getRelativeLuminance(secondaryColor) > 0.179;

	const foreground = ensureContrast(
		isLightBackground ? "#171717" : "#F5F5F5",
		secondaryColor,
		4.5,
	);
	const mutedForeground = ensureContrast(
		isLightBackground ? "#525252" : "#A3A3A3",
		secondaryColor,
		4.5,
	);
	const accent = ensureContrast(accentColor, secondaryColor, 4.5);
	const border = ensureContrast(
		isLightBackground ? "#D4D4D4" : "#525252",
		secondaryColor,
		3,
	);

	return { foreground, mutedForeground, accent, border };
}
