"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Button } from "@/components/ui/button";
import { Input, inputShellClassName } from "@/components/ui/input";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInvoiceCurrency } from "@/lib/invoice-format";

export type LineItemSuggestion = {
	description: string;
	unitPrice: number;
};

interface LineItemSelectorProps {
	value: string;
	onValueChange: (value: string) => void;
	onSelectSuggestion: (description: string, rate: number) => void;
	suggestions: LineItemSuggestion[] | undefined;
	clientSelected: boolean;
	placeholder?: string;
	required?: boolean;
	id?: string;
}

function suggestionValue(item: LineItemSuggestion) {
	return `${item.description}::${item.unitPrice}`;
}

export function LineItemSelector({
	value,
	onValueChange,
	onSelectSuggestion,
	suggestions,
	clientSelected,
	placeholder = "Service or product description",
	required,
	id,
}: LineItemSelectorProps) {
	const [comboboxOpen, setComboboxOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [popoverWidth, setPopoverWidth] = useState<number>();

	const trimmedValue = value.trim();
	const filteredSuggestions = useMemo(() => {
		if (!clientSelected) return [];
		return (
			suggestions?.filter((item) => {
				if (!trimmedValue) return true;
				return item.description.toLowerCase().includes(trimmedValue.toLowerCase());
			}) ?? []
		);
	}, [clientSelected, suggestions, trimmedValue]);

	useEffect(() => {
		if (!comboboxOpen || !containerRef.current) return;

		const updateWidth = () => {
			if (containerRef.current) {
				setPopoverWidth(containerRef.current.offsetWidth);
			}
		};

		updateWidth();
		window.addEventListener("resize", updateWidth);
		return () => window.removeEventListener("resize", updateWidth);
	}, [comboboxOpen]);

	if (!clientSelected) {
		return (
			<Input
				id={id}
				className="min-w-0 flex-1"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onValueChange(e.target.value)}
				required={required}
			/>
		);
	}

	const hasSavedItems = (suggestions?.length ?? 0) > 0;
	const showNoMatches =
		hasSavedItems && trimmedValue.length > 0 && filteredSuggestions.length === 0;

	const handleSelectSuggestion = (description: string, rate: number) => {
		onSelectSuggestion(description, rate);
		setComboboxOpen(false);
		inputRef.current?.focus();
	};

	return (
		<Popover open={comboboxOpen} onOpenChange={setComboboxOpen} modal={false}>
			<Command shouldFilter={false} loop className="overflow-visible bg-transparent">
				<PopoverAnchor asChild>
					<div
						ref={containerRef}
						className="relative flex min-w-0 flex-1"
						cmdk-input-wrapper=""
					>
						<CommandPrimitive.Input
							ref={inputRef}
							id={id}
							value={value}
							onValueChange={(nextValue) => {
								onValueChange(nextValue);
								setComboboxOpen(true);
							}}
							onFocus={() => setComboboxOpen(true)}
							placeholder={placeholder}
							required={required}
							autoComplete="off"
							className={cn(
								"flex h-9 w-full min-w-0 flex-1 px-3 py-1 pr-9 text-base transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm",
								inputShellClassName,
							)}
						/>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="absolute right-0 top-0 h-full shrink-0 px-2 hover:bg-transparent"
							aria-label="Show saved line items"
							onMouseDown={(e) => e.preventDefault()}
							onClick={() => {
								setComboboxOpen((open) => !open);
								inputRef.current?.focus();
							}}
						>
							<ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
						</Button>
					</div>
				</PopoverAnchor>
				<PopoverContent
					className="p-0"
					align="start"
					style={popoverWidth ? { width: popoverWidth } : undefined}
					onOpenAutoFocus={(e) => e.preventDefault()}
					onCloseAutoFocus={(e) => e.preventDefault()}
					onInteractOutside={(e) => {
						if (containerRef.current?.contains(e.target as Node)) {
							e.preventDefault();
						}
					}}
				>
					<CommandList>
						<CommandEmpty>
							{showNoMatches
								? "No saved match — keep typing and set a rate. It will be saved when you submit the invoice."
								: "No saved items for this client yet. Type a description and rate to create one."}
						</CommandEmpty>
						{filteredSuggestions.length > 0 ? (
							<CommandGroup>
								{filteredSuggestions.map((item) => (
									<CommandItem
										key={suggestionValue(item)}
										value={suggestionValue(item)}
										keywords={[item.description]}
										onMouseDown={(e) => e.preventDefault()}
										onSelect={() =>
											handleSelectSuggestion(item.description, item.unitPrice)
										}
									>
										<div className="flex w-full items-center justify-between gap-3">
											<span className="truncate">{item.description}</span>
											<span className="font-number shrink-0 text-xs text-muted-foreground tabular-nums">
												{formatInvoiceCurrency(item.unitPrice)}
											</span>
										</div>
									</CommandItem>
								))}
							</CommandGroup>
						) : null}
					</CommandList>
				</PopoverContent>
			</Command>
		</Popover>
	);
}
