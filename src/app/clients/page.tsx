"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import type { ClientRow } from "./columns";

import { Navigation } from "@/components/navigation";
import { DataTable } from "@/components/data-table/data-table";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { clientColumns } from "./columns";
import { useAppData } from "@/context/app-data-provider";
import { formatAddressParts } from "@/lib/utils";

export default function ClientsPage() {
	const { toast } = useToast();
	const [open, setOpen] = useState(false);
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [streetName, setStreetName] = useState("");
	const [buildingName, setBuildingName] = useState("");
	const [unitNumber, setUnitNumber] = useState("");
	const [postalCode, setPostalCode] = useState("");
	const [contactPerson, setContactPerson] = useState("");
	const [selectedClients, setSelectedClients] = useState<ClientRow[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);
	const [previewClientId, setPreviewClientId] = useState<Id<"clients"> | null>(
		null
	);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	const { currentUser: convexUser, clients } = useAppData();
	const createClient = useMutation(api.clients.create);
	const deleteClient = useMutation(api.clients.remove);

	const previewClient = useQuery(
		api.clients.get,
		previewClientId ? { clientId: previewClientId } : "skip"
	);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (!convexUser?._id) return;

		await createClient({
			userId: convexUser._id,
			name,
			email: email || undefined,
			streetName: streetName.trim() || undefined,
			buildingName: buildingName.trim() || undefined,
			unitNumber: unitNumber.trim() || undefined,
			postalCode: postalCode.trim() || undefined,
			contactPerson: contactPerson || undefined,
		});

		setName("");
		setEmail("");
		setStreetName("");
		setBuildingName("");
		setUnitNumber("");
		setPostalCode("");
		setContactPerson("");
		setOpen(false);
	};

	const clientList = useMemo(() => clients ?? [], [clients]);

	const tableData: ClientRow[] = useMemo(() => {
		return clientList.map((client) => {
			const formattedAddress = formatAddressParts({
				streetName: client.streetName ?? undefined,
				buildingName: client.buildingName ?? undefined,
				unitNumber: client.unitNumber ?? undefined,
				postalCode: client.postalCode ?? undefined,
			});
			const invoiceCount = (client as { invoiceCount?: number }).invoiceCount;
			return {
				_id: client._id,
				name: client.name,
				email: client.email ?? undefined,
				address: formattedAddress,
				contactPerson: client.contactPerson ?? undefined,
				createdAt: client.createdAt,
				invoiceCount:
					typeof invoiceCount === "number" && !Number.isNaN(invoiceCount)
						? invoiceCount
						: undefined,
			};
		});
	}, [clientList]);

	const fallbackPreviewClient = useMemo(() => {
		if (!previewClientId) return null;
		return clientList.find((client) => client._id === previewClientId) ?? null;
	}, [clientList, previewClientId]);

	const clientForPreview = previewClient ?? fallbackPreviewClient;
	const previewAddress = useMemo(() => {
		if (!clientForPreview) return undefined;
		return formatAddressParts({
			streetName: (clientForPreview as { streetName?: string }).streetName,
			buildingName: (clientForPreview as { buildingName?: string }).buildingName,
			unitNumber: (clientForPreview as { unitNumber?: string }).unitNumber,
			postalCode: (clientForPreview as { postalCode?: string }).postalCode,
		});
	}, [clientForPreview]);

	const previewInvoiceCount = useMemo(() => {
		if (!clientForPreview) return undefined;
		const count = (clientForPreview as { invoiceCount?: number }).invoiceCount;
		return typeof count === "number" && !Number.isNaN(count)
			? count
			: undefined;
	}, [clientForPreview]);

	const selectedIds = useMemo(
		() => selectedClients.map((client) => client._id),
		[selectedClients]
	);
	const selectedCount = selectedIds.length;

	const handlePreviewClose = useCallback(() => {
		setIsPreviewOpen(false);
		setPreviewClientId(null);
	}, []);

	const handleRowPreview = useCallback((client: ClientRow) => {
		setPreviewClientId(client._id);
		setIsPreviewOpen(true);
	}, []);

	const handleDeleteClient = useCallback(
		async (client: ClientRow) => {
			setIsDeleting(true);
			try {
				await deleteClient({ clientId: client._id });
				setSelectedClients((current) =>
					current.filter((item) => item._id !== client._id)
				);
				toast({
					title: "Client removed",
					description: `${client.name} has been deleted.`,
				});
				if (previewClientId === client._id) {
					handlePreviewClose();
				}
			} catch (error) {
				console.error(error);
				toast({
					title: "Unable to delete",
					description: "We couldn't delete the client. Please try again.",
					variant: "destructive",
				});
			} finally {
				setIsDeleting(false);
			}
		},
		[deleteClient, handlePreviewClose, previewClientId, toast]
	);

	const handleBulkDelete = useCallback(async () => {
		if (!selectedIds.length) return;
		setIsDeleting(true);
		try {
			for (const clientId of selectedIds) {
				await deleteClient({ clientId });
			}
			setSelectedClients([]);
			if (previewClientId && selectedIds.includes(previewClientId)) {
				handlePreviewClose();
			}
			toast({
				title: "Clients deleted",
				description: `Removed ${selectedIds.length} client(s).`,
			});
		} catch (error) {
			console.error(error);
			toast({
				title: "Unable to delete",
				description: "We couldn't delete one or more clients.",
				variant: "destructive",
			});
		} finally {
			setIsDeleting(false);
		}
	}, [deleteClient, handlePreviewClose, previewClientId, selectedIds, toast]);

	useEffect(() => {
		if (!previewClientId) return;
		const stillExists = clientList.some(
			(client) => client._id === previewClientId
		);
		if (!stillExists) {
			handlePreviewClose();
		}
	}, [clientList, handlePreviewClose, previewClientId]);

	return (
		<div className="min-h-screen">
			<Navigation />
			<main className="container mx-auto px-4 py-4 sm:py-8">
				<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<h1 className="text-3xl font-bold sm:text-4xl">Clients</h1>
					<Dialog open={open} onOpenChange={setOpen}>
						<DialogTrigger asChild>
							<Button>Add Client</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[520px]">
							<form onSubmit={handleSubmit} className="space-y-6">
								<DialogHeader>
									<DialogTitle>Add New Client</DialogTitle>
									<DialogDescription>
										Create a new client profile to use across invoices.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4">
									<div className="grid gap-2">
										<Label htmlFor="client-name">Name *</Label>
										<Input
											id="client-name"
											value={name}
											onChange={(event) => setName(event.target.value)}
											required
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="client-email">Email</Label>
										<Input
											id="client-email"
											type="email"
											value={email}
											onChange={(event) => setEmail(event.target.value)}
										/>
									</div>
									<div className="grid gap-2">
										<Label htmlFor="client-contact">Contact Person</Label>
										<Input
											id="client-contact"
											value={contactPerson}
											onChange={(event) => setContactPerson(event.target.value)}
										/>
									</div>
									<div className="grid gap-4 sm:grid-cols-2">
										<div className="grid gap-2 sm:col-span-2">
											<Label htmlFor="client-street">Street name</Label>
											<Input
												id="client-street"
												value={streetName}
												onChange={(event) => setStreetName(event.target.value)}
												placeholder="123 Main Street"
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="client-building">Building name</Label>
											<Input
												id="client-building"
												value={buildingName}
												onChange={(event) => setBuildingName(event.target.value)}
												placeholder="Sunrise Plaza"
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="client-unit">Unit number</Label>
											<Input
												id="client-unit"
												value={unitNumber}
												onChange={(event) => setUnitNumber(event.target.value)}
												placeholder="12-34"
											/>
										</div>
										<div className="grid gap-2">
											<Label htmlFor="client-postal">Postal code</Label>
											<Input
												id="client-postal"
												value={postalCode}
												onChange={(event) => setPostalCode(event.target.value)}
												placeholder="123456"
											/>
										</div>
									</div>
								</div>
								<DialogFooter>
									<Button type="submit">Add Client</Button>
								</DialogFooter>
							</form>
						</DialogContent>
					</Dialog>
				</div>

				{!clients && (
					<div className="text-muted-foreground">Loading clients...</div>
				)}

				{clients && clients.length === 0 && (
					<Card>
						<CardHeader>
							<CardTitle>No clients yet</CardTitle>
							<CardDescription>
								Add your first client to start generating invoices.
							</CardDescription>
						</CardHeader>
					</Card>
				)}

				{clients && clients.length > 0 && (
					<DataTable
						columns={clientColumns}
						data={tableData}
						filterKey="name"
						filterPlaceholder="Filter by client..."
						enableRowSelection
						onSelectionChange={setSelectedClients}
						renderToolbar={() =>
							selectedCount > 0 ? (
								<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
									<span className="text-sm text-muted-foreground">
										{selectedCount} selected
									</span>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant="destructive"
												size="sm"
												className="w-full sm:w-auto"
												disabled={isDeleting}
											>
												{isDeleting ? (
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												) : (
													<Trash2 className="mr-2 h-4 w-4" />
												)}
												Delete
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Delete {selectedCount} client(s)?
												</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel disabled={isDeleting}>
													Cancel
												</AlertDialogCancel>
												<AlertDialogAction
													onClick={() => void handleBulkDelete()}
													disabled={isDeleting}
													className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
												>
													{isDeleting ? (
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													) : (
														<Trash2 className="mr-2 h-4 w-4" />
													)}
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							) : null
						}
						meta={{ onDeleteClient: handleDeleteClient, isDeleting }}
						onRowClick={handleRowPreview}
					/>
				)}
			</main>
			<Dialog
				open={isPreviewOpen}
				onOpenChange={(open) => {
					if (!open) {
						handlePreviewClose();
					} else {
						setIsPreviewOpen(true);
					}
				}}
			>
				{isPreviewOpen ? (
					<DialogContent className="max-w-2xl space-y-6">
						{clientForPreview ? (
							<>
								<DialogHeader>
									<DialogTitle className="text-2xl">
										{clientForPreview.name}
									</DialogTitle>
									<DialogDescription>
										Snapshot of client information and recent activity.
									</DialogDescription>
								</DialogHeader>
								<div className="space-y-6">
									<div className="grid gap-6 md:grid-cols-2">
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">
												Primary contact
											</p>
											<p className="text-base font-semibold">
												{clientForPreview.contactPerson ?? "Not provided"}
											</p>
										</div>
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">
												Email
											</p>
											<p className="text-base">
												{clientForPreview.email ?? "Not provided"}
											</p>
										</div>
										<div className="space-y-2">
											<p className="text-sm font-medium text-muted-foreground">
												Created
											</p>
											<p className="text-base">
												{format(clientForPreview.createdAt, "MMM d, yyyy")}
											</p>
										</div>
										{typeof previewInvoiceCount === "number" ? (
											<div className="space-y-2">
												<p className="text-sm font-medium text-muted-foreground">
													Invoices
												</p>
												<p className="text-base">{previewInvoiceCount}</p>
											</div>
										) : null}
									</div>
									<div>
										<p className="mb-2 text-sm font-medium text-muted-foreground">
											Address
										</p>
										<p className="whitespace-pre-line rounded-md border bg-muted/30 p-3 text-sm">
											{previewAddress ?? "No address on file"}
										</p>
									</div>
								</div>
								<DialogFooter className="gap-2">
									<Button variant="outline" onClick={handlePreviewClose}>
										Close
									</Button>
									<Button asChild>
										<Link href={`/clients/${clientForPreview._id}`}>
											Open full profile
										</Link>
									</Button>
								</DialogFooter>
							</>
						) : (
							<div className="flex h-40 items-center justify-center">
								<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
							</div>
						)}
					</DialogContent>
				) : null}
			</Dialog>
		</div>
	);
}
