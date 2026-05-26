import { useImageUpload } from "@/hooks/use-image-upload";

export function useReceiptUpload() {
	const { uploadImage, isUploading } = useImageUpload();
	return { uploadReceipt: uploadImage, isUploading };
}
