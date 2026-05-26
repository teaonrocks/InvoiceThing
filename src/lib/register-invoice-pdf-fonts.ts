import { Font } from "@react-pdf/renderer";
import {
	getInvoiceFont,
	getPdfFontUrls,
	INVOICE_FONT_OPTIONS,
	type InvoiceFontOption,
} from "@/lib/invoice-branding";

const registeredFamilies = new Set<string>();

function registerFontOption(font: InvoiceFontOption) {
	if (registeredFamilies.has(font.pdfFamily)) return;

	const urls = getPdfFontUrls(font);
	Font.register({
		family: font.pdfFamily,
		fonts: [
			{ src: urls.regular, fontWeight: 400 },
			{ src: urls.medium, fontWeight: 500 },
			{ src: urls.bold, fontWeight: 700 },
		],
	});
	registeredFamilies.add(font.pdfFamily);
}

for (const font of INVOICE_FONT_OPTIONS) {
	registerFontOption(font);
}

Font.register({
	family: "DM Mono",
	fonts: [
		{
			src: `https://cdn.jsdelivr.net/npm/@fontsource/dm-mono@5/files/dm-mono-latin-400-normal.woff`,
			fontWeight: 400,
		},
		{
			src: `https://cdn.jsdelivr.net/npm/@fontsource/dm-mono@5/files/dm-mono-latin-500-normal.woff`,
			fontWeight: 500,
		},
	],
});

export function ensureInvoicePdfFont(fontKey?: string): InvoiceFontOption {
	const font = getInvoiceFont(fontKey);
	registerFontOption(font);
	return font;
}
