import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { compressImageFile } from "@/lib/image";
import { useToast } from "@/hooks/use-toast";

export function useReceiptUpload() {
	const { toast } = useToast();
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const [isUploading, setIsUploading] = useState(false);

	const uploadReceipt = useCallback(
		async (file: File): Promise<Id<"_storage"> | null> => {
			const isHeic =
				file.type === "image/heic" ||
				file.type === "image/heif" ||
				/\.hei[cf]$/i.test(file.name);

			if (!file.type.startsWith("image/") && !isHeic) {
				toast({
					title: "Invalid file",
					description: "Please upload an image file.",
					variant: "destructive",
				});
				return null;
			}

			if (file.size > 20 * 1024 * 1024) {
				toast({
					title: "File too large",
					description: "Images must be 20MB or smaller.",
					variant: "destructive",
				});
				return null;
			}

			setIsUploading(true);
			try {
				let compressedFile: File;
				try {
					compressedFile = await compressImageFile(file);
				} catch (error) {
					const message =
						error instanceof Error
							? error.message
							: typeof error === "string"
								? error
								: "Failed to convert image.";
					toast({
						title: "Upload failed",
						description: message,
						variant: "destructive",
					});
					return null;
				}

				if (compressedFile.size > 5 * 1024 * 1024) {
					toast({
						title: "File too large",
						description: "Compressed image must be 5MB or smaller.",
						variant: "destructive",
					});
					return null;
				}

				const uploadUrl = await generateUploadUrl();
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": compressedFile.type },
					body: compressedFile,
				});

				if (!response.ok) {
					throw new Error("Upload failed. Please try again.");
				}

				const { storageId } = await response.json();
				return storageId as Id<"_storage">;
			} catch (error) {
				console.error("Error uploading receipt:", error);
				toast({
					title: "Upload failed",
					description: "We couldn't upload that image. Please try again.",
					variant: "destructive",
				});
				return null;
			} finally {
				setIsUploading(false);
			}
		},
		[generateUploadUrl, toast],
	);

	return { uploadReceipt, isUploading };
}
