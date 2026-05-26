import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/components/invoice-status-badge";
import { useState } from "react";

export type InvoiceStatusOption = {
	value: InvoiceStatus;
	label: string;
	color: string;
};

export const INVOICE_STATUS_OPTIONS: InvoiceStatusOption[] = [
	{ value: "draft", label: "Draft", color: "bg-gray-500" },
	{ value: "sent", label: "Sent", color: "bg-blue-500" },
	{ value: "paid", label: "Paid", color: "bg-green-500" },
	{ value: "overdue", label: "Overdue", color: "bg-red-500" },
];

export function InvoiceStatusSelect({
	value,
	defaultValue,
	onValueChange,
	disabled,
	triggerClassName,
}: {
	value?: InvoiceStatus;
	defaultValue?: InvoiceStatus;
	onValueChange: (value: InvoiceStatus) => void;
	disabled?: boolean;
	triggerClassName?: string;
}) {
	const [selectedValueState, setSelectedValueState] = useState<InvoiceStatus | undefined>(defaultValue);
	const selectedValue = value ?? selectedValueState;
	const selectedOption = INVOICE_STATUS_OPTIONS.find(
		(option) => option.value === selectedValue,
	);

	const handleValueChange = (nextValue: InvoiceStatus) => {
		if (value === undefined) {
			setSelectedValueState(nextValue);
		}
		onValueChange(nextValue);
	};

	return (
		<Select
			value={value}
			defaultValue={defaultValue}
			onValueChange={(next) => handleValueChange(next as InvoiceStatus)}
			disabled={disabled}
		>
			<SelectTrigger className={cn("h-8 w-[140px]", triggerClassName)}>
				<SelectValue placeholder="Select status">
					{selectedOption ? (
						<span className="flex items-center gap-2">
							<span
								className={cn(
									"h-2.5 w-2.5 shrink-0 rounded-full",
									selectedOption.color,
								)}
							/>
							{selectedOption.label}
						</span>
					) : null}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{INVOICE_STATUS_OPTIONS.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value}
						textValue={option.label}
					>
						<span
							className={cn(
								"mr-2 inline-block h-2.5 w-2.5 shrink-0 rounded-full align-middle",
								option.color,
							)}
						/>
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
