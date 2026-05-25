import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Camera, ImageIcon, Images, Upload } from "lucide-react";

const ACCEPT = "image/*,.heic,.heif";

type ReceiptImagePickerProps = {
	idPrefix: string;
	onFileSelect: (file: File) => void;
	disabled?: boolean;
	isUploading?: boolean;
	hasImage?: boolean;
	onRemove?: () => void;
	compact?: boolean;
};

export function ReceiptImagePicker({
	idPrefix,
	onFileSelect,
	disabled,
	isUploading,
	hasImage,
	onRemove,
	compact,
}: ReceiptImagePickerProps) {
	const isMobile = useIsMobile();

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) onFileSelect(file);
		e.target.value = "";
	};

	if (isUploading) {
		return (
			<div
				className={cn(
					"flex items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/20 px-4 py-6",
					compact && "min-h-[88px] py-4",
				)}
			>
				<Spinner className="h-5 w-5" />
				<span className="text-sm text-muted-foreground">Uploading…</span>
			</div>
		);
	}

	if (hasImage) {
		return (
			<div className="space-y-2">
				<div className="flex items-center gap-2 border border-border bg-muted/20 px-3 py-3">
					<ImageIcon className="h-5 w-5 shrink-0 text-brand" />
					<span className="text-sm font-medium">Receipt attached</span>
				</div>
				{isMobile ? (
					<div className="grid grid-cols-2 gap-2">
						<ReceiptPickerButton
							id={`${idPrefix}-camera-replace`}
							label="Retake"
							icon={Camera}
							capture="environment"
							disabled={disabled}
							onChange={handleChange}
						/>
						<ReceiptPickerButton
							id={`${idPrefix}-gallery-replace`}
							label="Replace"
							icon={Images}
							disabled={disabled}
							onChange={handleChange}
						/>
					</div>
				) : (
					<ReceiptPickerButton
						id={`${idPrefix}-replace`}
						label="Change receipt"
						icon={Upload}
						disabled={disabled}
						onChange={handleChange}
						className="w-full"
					/>
				)}
				{onRemove ? (
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-8 w-full rounded-none px-0 text-muted-foreground sm:w-auto"
						onClick={onRemove}
						disabled={disabled}
					>
						Remove receipt
					</Button>
				) : null}
			</div>
		);
	}

	if (isMobile) {
		return (
			<div className="grid grid-cols-2 gap-2">
				<ReceiptPickerButton
					id={`${idPrefix}-camera`}
					label="Take photo"
					icon={Camera}
					capture="environment"
					disabled={disabled}
					onChange={handleChange}
					variant="brand"
				/>
				<ReceiptPickerButton
					id={`${idPrefix}-gallery`}
					label="Gallery"
					icon={Images}
					disabled={disabled}
					onChange={handleChange}
				/>
			</div>
		);
	}

	return (
		<label
			htmlFor={`${idPrefix}-file`}
			className={cn(
				"flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border bg-muted/20 px-4 py-4 transition-colors hover:border-brand hover:bg-muted/40",
				disabled && "pointer-events-none opacity-50",
				compact && "min-h-[88px] sm:min-h-0 sm:flex-row sm:justify-start sm:border sm:border-solid sm:bg-transparent sm:px-3 sm:py-2",
			)}
		>
			<Upload className="h-5 w-5 text-brand" />
			<span className="text-sm font-medium">Upload receipt photo</span>
			<input
				id={`${idPrefix}-file`}
				type="file"
				accept={ACCEPT}
				className="hidden"
				disabled={disabled}
				onChange={handleChange}
			/>
		</label>
	);
}

function ReceiptPickerButton({
	id,
	label,
	icon: Icon,
	capture,
	disabled,
	onChange,
	variant = "outline",
	className,
}: {
	id: string;
	label: string;
	icon: typeof Camera;
	capture?: string;
	disabled?: boolean;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	variant?: "outline" | "brand";
	className?: string;
}) {
	return (
		<label
			htmlFor={id}
			className={cn(
				"block",
				disabled && "pointer-events-none opacity-50",
				className,
			)}
		>
			<span
				className={cn(
					"flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-none border font-dm text-xs font-medium transition-colors",
					variant === "brand"
						? "border-brand bg-brand text-brand-foreground hover:bg-brand/90"
						: "border-border bg-card hover:bg-accent hover:text-accent-foreground",
				)}
			>
				<Icon className="h-4 w-4 shrink-0" />
				{label}
			</span>
			<input
				id={id}
				type="file"
				accept={ACCEPT}
				capture={capture}
				className="hidden"
				disabled={disabled}
				onChange={onChange}
			/>
		</label>
	);
}
