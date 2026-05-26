import {
	INVOICE_LOGO_HEIGHT,
	INVOICE_LOGO_MAX_WIDTH,
} from "@/lib/invoice-branding";
import { cn } from "@/lib/utils";

const logoStyle = {
	height: INVOICE_LOGO_HEIGHT,
	maxWidth: INVOICE_LOGO_MAX_WIDTH,
	width: "auto",
} as const;

export function InvoiceLogoImage({
	src,
	alt = "Company logo",
	className,
	align = "right",
}: {
	src: string;
	alt?: string;
	className?: string;
	align?: "left" | "center" | "right";
}) {
	const image = (
		<img
			src={src}
			alt={alt}
			className="block shrink-0 object-contain"
			style={logoStyle}
		/>
	);

	if (align === "center") {
		return <div className={cn("flex justify-center", className)}>{image}</div>;
	}

	return className ? <div className={className}>{image}</div> : image;
}
