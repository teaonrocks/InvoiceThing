type CompressImageOptions = {
	maxDimension?: number;
	quality?: number;
	mimeType?: string;
	/** Keep PNG/WebP alpha instead of converting to JPEG (avoids black backgrounds). */
	preserveTransparency?: boolean;
};

const isSvgFile = (file: File) =>
	file.type === "image/svg+xml" || /\.svg$/i.test(file.name);

const shouldOutputPng = (file: File, preserveTransparency: boolean) =>
	preserveTransparency &&
	(file.type === "image/png" ||
		file.type === "image/webp" ||
		/\.png$/i.test(file.name) ||
		/\.webp$/i.test(file.name));

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.8;
const DEFAULT_MIME_TYPE = "image/jpeg";
const HEIC_MIME_TYPES = new Set([
	"image/heic",
	"image/heif",
	"image/heic-sequence",
	"image/heif-sequence",
]);

const isHeicFile = (file: File) => {
	const extension = file.name.split(".").pop()?.toLowerCase();
	return (
		HEIC_MIME_TYPES.has(file.type) ||
		extension === "heic" ||
		extension === "heif"
	);
};

const errorToMessage = (error: unknown) => {
	if (error instanceof Error) {
		return error.message;
	}
	if (typeof error === "string") {
		return error;
	}
	try {
		return JSON.stringify(error);
	} catch {
		return String(error || "Unknown error.");
	}
};

const convertHeicToJpeg = async (file: File, quality: number) => {
	try {
		const heic2any = (await import("heic2any")).default;
		const heicBlob = file.type ? file : file.slice(0, file.size, "image/heic");
		const result = await heic2any({
			blob: heicBlob,
			toType: "image/jpeg",
			quality,
		});
		const candidate: unknown = Array.isArray(result) ? result[0] : result;
		if (!candidate) {
			throw new Error("Failed to convert HEIC image.");
		}
		if (candidate instanceof Blob) {
			return candidate;
		}
		if (candidate instanceof ArrayBuffer) {
			return new Blob([candidate], { type: "image/jpeg" });
		}
		throw new Error("Unsupported HEIC conversion result.");
	} catch (error) {
		const message = errorToMessage(error);
		const isFormatUnsupported =
			message.includes("ERR_LIBHEIF") ||
			message.includes("format not supported");
		if (isFormatUnsupported) {
			try {
				const { heicTo } = await import("heic-to");
				return await heicTo({
					blob: file,
					type: "image/jpeg",
					quality,
				});
			} catch (fallbackError) {
				const fallbackMessage = errorToMessage(fallbackError);
				throw new Error(
					`HEIC conversion failed: ${message}. Fallback failed: ${fallbackMessage}`,
				);
			}
		}
		throw new Error(`HEIC conversion failed: ${message}`);
	}
};

export const compressImageFile = async (
	file: File,
	{
		maxDimension = DEFAULT_MAX_DIMENSION,
		quality = DEFAULT_QUALITY,
		mimeType = DEFAULT_MIME_TYPE,
		preserveTransparency = false,
	}: CompressImageOptions = {},
): Promise<File> => {
	if (isSvgFile(file)) {
		return file;
	}

	const outputMime = shouldOutputPng(file, preserveTransparency)
		? "image/png"
		: mimeType;

	let sourceBlob: Blob = file;
	let sourceWidth = 0;
	let sourceHeight = 0;
	let drawTarget: CanvasImageSource | null = null;
	let releaseObjectUrl: string | null = null;

	const decodeSource = async (errorContext?: unknown) => {
		try {
			const bitmap = await createImageBitmap(sourceBlob);
			sourceWidth = bitmap.width;
			sourceHeight = bitmap.height;
			drawTarget = bitmap as unknown as CanvasImageSource;
			return;
		} catch (error) {
			const objectUrl = URL.createObjectURL(sourceBlob);
			releaseObjectUrl = objectUrl;
			const image = await new Promise<HTMLImageElement>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = () => {
					const message =
						errorContext instanceof Error
							? errorContext.message
							: error instanceof Error
								? error.message
								: typeof error === "string"
									? error
									: "Unknown decode error.";
					reject(new Error(`Failed to decode image: ${message}`));
				};
				img.src = objectUrl;
			});
			sourceWidth = image.naturalWidth || image.width;
			sourceHeight = image.naturalHeight || image.height;
			drawTarget = image;
		}
	};

	try {
		await decodeSource();
	} catch (error) {
		if (isHeicFile(file)) {
			sourceBlob = await convertHeicToJpeg(file, quality);
			await decodeSource(error);
		} else {
			throw error;
		}
	}

	const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
	const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
	const targetHeight = Math.max(1, Math.round(sourceHeight * scale));

	const canvas = document.createElement("canvas");
	canvas.width = targetWidth;
	canvas.height = targetHeight;

	const context = canvas.getContext("2d");
	if (!context || !drawTarget) {
		if (releaseObjectUrl) {
			URL.revokeObjectURL(releaseObjectUrl);
		}
		throw new Error("Failed to create canvas context for compression.");
	}

	if (outputMime === "image/png") {
		context.clearRect(0, 0, targetWidth, targetHeight);
	}
	context.drawImage(drawTarget, 0, 0, targetWidth, targetHeight);
	if (releaseObjectUrl) {
		URL.revokeObjectURL(releaseObjectUrl);
	}

	const blob = await new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(
			(result) => {
				if (!result) {
					reject(new Error("Failed to compress image."));
					return;
				}
				resolve(result);
			},
			outputMime,
			quality,
		);
	});

	const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
	const extension = outputMime === "image/png" ? "png" : "jpg";
	const fileName = `${baseName}.${extension}`;
	return new File([blob], fileName, {
		type: outputMime,
		lastModified: file.lastModified,
	});
};

type FetchImageDataUrlOptions = {
	maxDimension?: number;
	/** Keep PNG alpha for logos; receipts should stay JPEG. */
	preserveTransparency?: boolean;
};

/** Fetch a remote image and return a data URL suitable for react-pdf. */
export async function fetchImageDataUrl(
	url: string,
	{
		maxDimension = 1200,
		preserveTransparency = false,
	}: FetchImageDataUrlOptions = {},
): Promise<string | undefined> {
	if (typeof document === "undefined") {
		return undefined;
	}

	try {
		const response = await fetch(url, { cache: "no-cache" });
		if (!response.ok) {
			return undefined;
		}

		const blob = await response.blob();
		if (!blob.size) {
			return undefined;
		}

		const objectUrl = URL.createObjectURL(blob);
		try {
			const image = await new Promise<HTMLImageElement>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve(img);
				img.onerror = () => reject(new Error("Failed to decode image"));
				img.src = objectUrl;
			});

			const scale = Math.min(
				1,
				maxDimension / Math.max(image.naturalWidth, image.naturalHeight, 1),
			);
			const width = Math.max(1, Math.round(image.naturalWidth * scale));
			const height = Math.max(1, Math.round(image.naturalHeight * scale));

			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const context = canvas.getContext("2d");
			if (!context) {
				return undefined;
			}

			const outputMime = preserveTransparency ? "image/png" : "image/jpeg";
			if (preserveTransparency) {
				context.clearRect(0, 0, width, height);
			}

			context.drawImage(image, 0, 0, width, height);

			return await new Promise((resolve, reject) => {
				canvas.toBlob(
					(result) => {
						if (!result) {
							reject(new Error("Failed to encode image for PDF"));
							return;
						}

						const reader = new FileReader();
						reader.onload = () => resolve(reader.result as string);
						reader.onerror = () => reject(reader.error);
						reader.readAsDataURL(result);
					},
					outputMime,
					preserveTransparency ? undefined : 0.82,
				);
			});
		} finally {
			URL.revokeObjectURL(objectUrl);
		}
	} catch (error) {
		console.warn("Failed to fetch image for PDF:", error);
		return undefined;
	}
}
