import { Link } from "@tanstack/react-router";
import { Camera, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileQuickActionsProps = {
	onUploadReceipt: () => void;
	className?: string;
};

export function MobileQuickActions({
	onUploadReceipt,
	className,
}: MobileQuickActionsProps) {
	return (
		<div
			className={cn(
				"grid grid-cols-3 gap-2 border border-border bg-card p-3 md:hidden",
				className,
			)}
		>
			<Button
				type="button"
				variant="brand"
				className="h-auto flex-col gap-1.5 rounded-none py-3 font-dm text-xs font-600"
				onClick={onUploadReceipt}
			>
				<Camera className="h-4 w-4" />
				Upload receipt
			</Button>
			<Button
				type="button"
				variant="outline"
				className="h-auto flex-col gap-1.5 rounded-none py-3 font-dm text-xs"
				asChild
			>
				<Link to="/invoices">
					<Receipt className="h-4 w-4" />
					Update invoice
				</Link>
			</Button>
			<Button
				type="button"
				variant="outline"
				className="h-auto flex-col gap-1.5 rounded-none py-3 font-dm text-xs"
				asChild
			>
				<Link to="/invoices/new">
					<FileText className="h-4 w-4" />
					New invoice
				</Link>
			</Button>
		</div>
	);
}
