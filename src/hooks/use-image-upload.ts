import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { compressImageFile } from "@/lib/image";
import { useToast } from "@/hooks/use-toast";

type UseImageUploadOptions = {
	maxOriginalBytes?: number;
	maxCompressedBytes?: number;
	compress?: boolean;
	/** Preserve PNG/WebP transparency when compressing (for logos). */
	preserveTransparency?: boolean;
};

export function useImageUpload(options: UseImageUploadOptions = {}) {
	const {
		maxOriginalBytes = 20 * 1024 * 1024,
		maxCompressedBytes = 5 * 1024 * 1024,
		compress = true,
		preserveTransparency = false,
	} = options;
	const { toast } = useToast();
	const generateUploadUrl = useMutation(api.files.generateUploadUrl);
	const [isUploading, setIsUploading] = useState(false);

	const uploadImage = useCallback(
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

			if (file.size > maxOriginalBytes) {
				toast({
					title: "File too large",
					description: `Images must be ${Math.round(maxOriginalBytes / (1024 * 1024))}MB or smaller.`,
					variant: "destructive",
				});
				return null;
			}

			setIsUploading(true);
			try {
				let uploadFile = file;
				if (compress) {
					try {
						uploadFile = await compressImageFile(file, {
							preserveTransparency,
						});
					} catch (error) {
						const message =
							error instanceof Error
								? error.message
								: typeof error === "string"
									? error
									: "Failed to process image.";
						toast({
							title: "Upload failed",
							description: message,
							variant: "destructive",
						});
						return null;
					}

					if (uploadFile.size > maxCompressedBytes) {
						toast({
							title: "File too large",
							description: `Compressed image must be ${Math.round(maxCompressedBytes / (1024 * 1024))}MB or smaller.`,
							variant: "destructive",
						});
						return null;
					}
				}

				const uploadUrl = await generateUploadUrl();
				const response = await fetch(uploadUrl, {
					method: "POST",
					headers: { "Content-Type": uploadFile.type },
					body: uploadFile,
				});

				if (!response.ok) {
					throw new Error("Upload failed. Please try again.");
				}

				const { storageId } = await response.json();
				return storageId as Id<"_storage">;
			} catch (error) {
				console.error("Error uploading image:", error);
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
		[
			compress,
			preserveTransparency,
			generateUploadUrl,
			maxCompressedBytes,
			maxOriginalBytes,
			toast,
		],
	);

	return { uploadImage, isUploading };
}
