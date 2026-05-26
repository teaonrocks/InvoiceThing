import { useEffect } from "react";
import { getInvoiceFont } from "@/lib/invoice-branding";

export function useInvoiceBrandingFont(fontKey?: string) {
	const font = getInvoiceFont(fontKey);

	useEffect(() => {
		const linkId = `invoice-branding-font-${font.key}`;
		if (document.getElementById(linkId)) return;

		const link = document.createElement("link");
		link.id = linkId;
		link.rel = "stylesheet";
		link.href = font.googleFontsUrl;
		document.head.appendChild(link);
	}, [font.googleFontsUrl, font.key]);

	return font;
}
