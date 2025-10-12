"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Loader2, Trash2, Save } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function ClientDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const router = useRouter();
	const { id } = use(params);
	const { toast } = useToast();

	const client = useQuery(api.clients.get, {
		clientId: id as Id<"clients">,
	});
	const updateClient = useMutation(api.clients.update);
	const deleteClient = useMutation(api.clients.remove);

	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [address, setAddress] = useState("");
	const [contactPerson, setContactPerson] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	// Load client data when available
	useEffect(() => {
		if (client && !isLoaded) {
			setName(client.name);
			setEmail(client.email || "");
			setAddress(client.address || "");
			setContactPerson(client.contactPerson || "");
			setIsLoaded(true);
		}
	}, [client, isLoaded]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!name) {
			toast({
				title: "Error",
				description: "Name is required",
				variant: "destructive",
			});
			return;
		}

		setIsSubmitting(true);

		try {
			await updateClient({
				clientId: id as Id<"clients">,
				name,
				email: email || undefined,
				address: address || undefined,
				contactPerson: contactPerson || undefined,
			});

			toast({
				title: "Success",
				description: "Client updated successfully",
			});

			setIsEditing(false);
		} catch (error) {
			console.error("Error updating client:", error);
			toast({
				title: "Error",
				description: "Failed to update client. Please try again.",
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);

		try {
			await deleteClient({ clientId: id as Id<"clients"> });

			toast({
				title: "Success",
				description: "Client deleted successfully",
			});

			router.push("/clients");
		} catch (error) {
			console.error("Error deleting client:", error);
			toast({
				title: "Error",
				description: "Failed to delete client. Please try again.",
				variant: "destructive",
			});
			setIsDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	if (!client) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<div className="container max-w-3xl mx-auto py-8">
			<div className="mb-6">
				<Link href="/clients">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Clients
					</Button>
				</Link>
			</div>

			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="text-2xl">
							{isEditing ? "Edit Client" : client.name}
						</CardTitle>
						{!isEditing && (
							<div className="flex gap-2">
								<Button onClick={() => setIsEditing(true)} size="sm">
									<Save className="h-4 w-4 mr-2" />
									Edit
								</Button>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => setShowDeleteDialog(true)}
								>
									<Trash2 className="h-4 w-4 mr-2" />
									Delete
								</Button>
							</div>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{isEditing ? (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Name *</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Client name"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="client@example.com"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="address">Address</Label>
								<Textarea
									id="address"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="123 Main St, City, State, ZIP"
									rows={3}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="contactPerson">Contact Person</Label>
								<Input
									id="contactPerson"
									value={contactPerson}
									onChange={(e) => setContactPerson(e.target.value)}
									placeholder="John Doe"
								/>
							</div>

							<div className="flex justify-end gap-3 pt-4">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setIsEditing(false);
										// Reset to original values
										if (client) {
											setName(client.name);
											setEmail(client.email || "");
											setAddress(client.address || "");
											setContactPerson(client.contactPerson || "");
										}
									}}
									disabled={isSubmitting}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<>
											<Loader2 className="h-4 w-4 mr-2 animate-spin" />
											Saving...
										</>
									) : (
										"Save Changes"
									)}
								</Button>
							</div>
						</form>
					) : (
						<div className="space-y-4">
							<div>
								<Label className="text-muted-foreground">Email</Label>
								<p className="text-lg">{client.email || "No email provided"}</p>
							</div>

							{client.address && (
								<div>
									<Label className="text-muted-foreground">Address</Label>
									<p className="text-lg whitespace-pre-wrap">
										{client.address}
									</p>
								</div>
							)}

							{client.contactPerson && (
								<div>
									<Label className="text-muted-foreground">
										Contact Person
									</Label>
									<p className="text-lg">{client.contactPerson}</p>
								</div>
							)}

							<div className="border-t pt-4 mt-6">
								<Label className="text-muted-foreground">Created</Label>
								<p className="text-sm">
									{new Date(client.createdAt).toLocaleDateString("en-US", {
										year: "numeric",
										month: "long",
										day: "numeric",
									})}
								</p>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Client</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <strong>{client.name}</strong>?
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowDeleteDialog(false)}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={handleDelete}
							disabled={isDeleting}
						>
							{isDeleting ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Deleting...
								</>
							) : (
								"Delete Client"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
