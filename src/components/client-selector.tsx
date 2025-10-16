"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Client = {
	_id: string;
	name: string;
	email?: string;
};

interface ClientSelectorProps {
	clients: Client[] | undefined;
	selectedClientId: string;
	onClientSelect: (clientId: string) => void;
	onCreateNewClient?: (searchValue: string) => void;
	placeholder?: string;
	showCreateOption?: boolean;
}

export function ClientSelector({
	clients,
	selectedClientId,
	onClientSelect,
	onCreateNewClient,
	placeholder = "Select a client...",
	showCreateOption = false,
}: ClientSelectorProps) {
	const [comboboxOpen, setComboboxOpen] = useState(false);
	const [searchValue, setSearchValue] = useState("");

	const selectedClient = clients?.find(
		(client) => client._id === selectedClientId
	);

	const filteredClients = clients?.filter((client) =>
		client.name.toLowerCase().includes(searchValue.toLowerCase())
	);

	const handleCreateNew = () => {
		setComboboxOpen(false);
		onCreateNewClient?.(searchValue);
		setSearchValue("");
	};

	return (
		<Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={comboboxOpen}
					className="w-full justify-between"
				>
					{selectedClient ? selectedClient.name : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search clients..."
						value={searchValue}
						onValueChange={setSearchValue}
					/>
					<CommandList>
						<CommandEmpty>
							{showCreateOption ? (
								<div className="p-4 text-center">
									<p className="text-sm text-muted-foreground mb-3">
										No clients found.
									</p>
									<Button size="sm" onClick={handleCreateNew}>
										<Plus className="h-4 w-4 mr-2" />
										Create &quot;{searchValue || "New Client"}&quot;
									</Button>
								</div>
							) : (
								<div className="p-4 text-center text-sm text-muted-foreground">
									No clients found.
								</div>
							)}
						</CommandEmpty>
						<CommandGroup>
							{filteredClients?.map((client) => (
								<CommandItem
									key={client._id}
									value={client.name}
									onSelect={() => {
										onClientSelect(client._id);
										setComboboxOpen(false);
										setSearchValue("");
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											selectedClientId === client._id
												? "opacity-100"
												: "opacity-0"
										)}
									/>
									<div className="flex flex-col">
										<span>{client.name}</span>
										{client.email && (
											<span className="text-xs text-muted-foreground">
												{client.email}
											</span>
										)}
									</div>
								</CommandItem>
							))}
							{showCreateOption && filteredClients && filteredClients.length > 0 && (
								<CommandItem
									onSelect={handleCreateNew}
									className="border-t"
								>
									<Plus className="mr-2 h-4 w-4" />
									<span className="font-medium">Create New Client</span>
								</CommandItem>
							)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
