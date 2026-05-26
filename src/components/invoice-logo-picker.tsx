import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { ImageIcon, Upload, X } from "lucide-react";
import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const ACCEPT = ALLOWED_MIME_TYPES.join(",");

type InvoiceLogoPickerProps = {
	idPrefix: string;
	logoUrl?: string;
	onFileSelect: (file: File) => void;
	onRemove?: () => void;
	disabled?: boolean;
	isUploading?: boolean;
};

export function InvoiceLogoPicker({
	idPrefix,
	logoUrl,
	onFileSelect,
	onRemove,
	disabled,
	isUploading,
}: InvoiceLogoPickerProps) {
	const [error, setError] = useState<string | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		setError(null);

		if (!file) {
			e.target.value = "";
			return;
		}

		if (file.size > MAX_FILE_SIZE) {
			setError("File size must be 5MB or smaller");
			e.target.value = "";
			return;
		}

		if (!ALLOWED_MIME_TYPES.includes(file.type)) {
			setError("File must be PNG, JPEG, or SVG");
			e.target.value = "";
			return;
		}

		onFileSelect(file);
		e.target.value = "";
	};

	if (isUploading) {
		return (
			<div className="flex items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/20 px-4 py-8">
				<Spinner className="h-5 w-5" />
				<span className="text-sm text-muted-foreground">Uploading logo…</span>
			</div>
		);
	}

	if (logoUrl) {
		return (
			<div className="space-y-3">
				{error ? (
					<p className="text-sm text-destructive">{error}</p>
				) : null}
				<div className="flex items-center gap-4 border border-border bg-muted/20 p-4">
					<img
						src={logoUrl}
						alt="Invoice logo"
						className="max-h-16 max-w-[10rem] object-contain"
					/>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<ImageIcon className="h-4 w-4 shrink-0 text-brand" />
							<span className="text-sm font-medium">Logo attached</span>
						</div>
						<p className="mt-1 text-xs text-muted-foreground">
							Shown on invoice previews and PDFs.
						</p>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					<label
						htmlFor={`${idPrefix}-replace`}
						className={cn(disabled && "pointer-events-none opacity-50")}
					>
						<span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-none border border-border bg-card px-3 text-xs font-medium hover:bg-accent">
							<Upload className="h-4 w-4" />
							Replace logo
						</span>
						<input
							id={`${idPrefix}-replace`}
							type="file"
							accept={ACCEPT}
							className="hidden"
							disabled={disabled}
							onChange={handleChange}
						/>
					</label>
					{onRemove ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-9 rounded-none text-muted-foreground"
							onClick={onRemove}
							disabled={disabled}
						>
							<X className="mr-1 h-4 w-4" />
							Remove
						</Button>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{error ? (
				<p className="text-sm text-destructive">{error}</p>
			) : null}
			<label
				htmlFor={`${idPrefix}-file`}
				className={cn(
					"flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/20 px-4 py-8 transition-colors hover:border-brand hover:bg-muted/40",
					disabled && "pointer-events-none opacity-50",
				)}
			>
				<Upload className="h-5 w-5 text-brand" />
				<span className="text-sm font-medium">Upload logo</span>
				<span className="text-xs text-muted-foreground">PNG, JPG, or SVG recommended</span>
				<input
					id={`${idPrefix}-file`}
					type="file"
					accept={ACCEPT}
					className="hidden"
					disabled={disabled}
					onChange={handleChange}
				/>
			</label>
		</div>
	);
}
