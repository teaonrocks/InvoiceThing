import type { Id } from "@/../convex/_generated/dataModel";

export const DEFAULT_INVOICE_ACCENT_COLOR = "#EB3D58";
export const DEFAULT_INVOICE_SECONDARY_COLOR = "#F5F3F0";
export const DEFAULT_INVOICE_FONT_KEY = "dm-sans";

export type InvoiceFontKey =
	| "dm-sans"
	| "space-grotesk"
	| "inter"
	| "lora"
	| "merriweather"
	| "montserrat"
	| "nunito-sans"
	| "playfair-display"
	| "roboto-slab"
	| "source-sans-3";

export type InvoiceFontOption = {
	key: InvoiceFontKey;
	label: string;
	cssFamily: string;
	googleFontsUrl: string;
	pdfFamily: string;
	pdfPackage: string;
};

const FONT_CDN = "https://cdn.jsdelivr.net/npm";

export const INVOICE_FONT_OPTIONS: InvoiceFontOption[] = [
	{
		key: "dm-sans",
		label: "DM Sans",
		cssFamily: '"DM Sans", sans-serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
		pdfFamily: "DM Sans",
		pdfPackage: "dm-sans",
	},
	{
		key: "space-grotesk",
		label: "Space Grotesk",
		cssFamily: '"Space Grotesk", sans-serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
		pdfFamily: "Space Grotesk",
		pdfPackage: "space-grotesk",
	},
	{
		key: "inter",
		label: "Inter",
		cssFamily: '"Inter", sans-serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
		pdfFamily: "Inter",
		pdfPackage: "inter",
	},
	{
		key: "lora",
		label: "Lora",
		cssFamily: '"Lora", serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
		pdfFamily: "Lora",
		pdfPackage: "lora",
	},
	{
		key: "merriweather",
		label: "Merriweather",
		cssFamily: '"Merriweather", serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap",
		pdfFamily: "Merriweather",
		pdfPackage: "merriweather",
	},
	{
		key: "montserrat",
		label: "Montserrat",
		cssFamily: '"Montserrat", sans-serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap",
		pdfFamily: "Montserrat",
		pdfPackage: "montserrat",
	},
	{
		key: "nunito-sans",
		label: "Nunito Sans",
		cssFamily: '"Nunito Sans", sans-serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap",
		pdfFamily: "Nunito Sans",
		pdfPackage: "nunito-sans",
	},
	{
		key: "playfair-display",
		label: "Playfair Display",
		cssFamily: '"Playfair Display", serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap",
		pdfFamily: "Playfair Display",
		pdfPackage: "playfair-display",
	},
	{
		key: "roboto-slab",
		label: "Roboto Slab",
		cssFamily: '"Roboto Slab", serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600;700&display=swap",
		pdfFamily: "Roboto Slab",
		pdfPackage: "roboto-slab",
	},
	{
		key: "source-sans-3",
		label: "Source Sans 3",
		cssFamily: '"Source Sans 3", sans-serif',
		googleFontsUrl:
			"https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&display=swap",
		pdfFamily: "Source Sans 3",
		pdfPackage: "source-sans-3",
	},
];

export const INVOICE_COLOR_PRESETS = [
	{ name: "Coral", accent: "#EB3D58", secondary: "#FDF2F4" },
	{ name: "Navy", accent: "#1E3A5F", secondary: "#EEF2F7" },
	{ name: "Forest", accent: "#2D6A4F", secondary: "#EDF5F0" },
	{ name: "Slate", accent: "#334155", secondary: "#F1F5F9" },
	{ name: "Plum", accent: "#6B21A8", secondary: "#F5F0FA" },
] as const;

export type InvoiceBranding = {
	logoUrl?: string;
	accentColor: string;
	secondaryColor: string;
	fontKey: InvoiceFontKey;
	fontFamily: string;
	fontCssFamily: string;
};

export type SettingsBrandingSource = {
	logoStorageId?: Id<"_storage">;
	invoiceAccentColor?: string;
	invoiceSecondaryColor?: string;
	invoiceFontFamily?: string;
};

const HEX_COLOR_RE = /^#([0-9A-Fa-f]{6})$/;

export function isHexColor(value: string): boolean {
	return HEX_COLOR_RE.test(value.trim());
}

export function normalizeHexColor(value: string): string | null {
	const trimmed = value.trim();
	if (!isHexColor(trimmed)) return null;
	return `#${trimmed.slice(1).toUpperCase()}`;
}

export function resolveInvoiceFontKey(stored?: string): InvoiceFontKey {
	if (!stored?.trim()) return DEFAULT_INVOICE_FONT_KEY;

	const normalized = stored.trim().toLowerCase();
	const byKey = INVOICE_FONT_OPTIONS.find((font) => font.key === normalized);
	if (byKey) return byKey.key;

	const byLabel = INVOICE_FONT_OPTIONS.find(
		(font) => font.label.toLowerCase() === normalized,
	);
	if (byLabel) return byLabel.key;

	const byPdfFamily = INVOICE_FONT_OPTIONS.find(
		(font) => font.pdfFamily.toLowerCase() === normalized,
	);
	if (byPdfFamily) return byPdfFamily.key;

	return DEFAULT_INVOICE_FONT_KEY;
}

export function getInvoiceFont(key?: string): InvoiceFontOption {
	const resolvedKey = resolveInvoiceFontKey(key);
	return INVOICE_FONT_OPTIONS.find((font) => font.key === resolvedKey)!;
}

export function buildInvoiceBranding(
	settings?: SettingsBrandingSource | null,
	logoUrl?: string | null,
): InvoiceBranding {
	const font = getInvoiceFont(settings?.invoiceFontFamily);
	return {
		logoUrl: logoUrl ?? undefined,
		accentColor: normalizeHexColor(settings?.invoiceAccentColor ?? "") ??
			DEFAULT_INVOICE_ACCENT_COLOR,
		secondaryColor:
			normalizeHexColor(settings?.invoiceSecondaryColor ?? "") ??
			DEFAULT_INVOICE_SECONDARY_COLOR,
		fontKey: font.key,
		fontFamily: font.pdfFamily,
		fontCssFamily: font.cssFamily,
	};
}

export function getPdfFontUrls(font: InvoiceFontOption) {
	const pkg = font.pdfPackage;
	return {
		regular: `${FONT_CDN}/@fontsource/${pkg}@5/files/${pkg}-latin-400-normal.woff`,
		medium: `${FONT_CDN}/@fontsource/${pkg}@5/files/${pkg}-latin-500-normal.woff`,
		bold: `${FONT_CDN}/@fontsource/${pkg}@5/files/${pkg}-latin-700-normal.woff`,
	};
}
