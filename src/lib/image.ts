type CompressImageOptions = {
	maxDimension?: number;
	quality?: number;
	mimeType?: string;
};

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
	return HEIC_MIME_TYPES.has(file.type) || extension === "heic" || extension === "heif";
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
			message.includes("ERR_LIBHEIF") || message.includes("format not supported");
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
					`HEIC conversion failed: ${message}. Fallback failed: ${fallbackMessage}`
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
	}: CompressImageOptions = {}
): Promise<File> => {
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
			mimeType,
			quality
		);
	});

	const baseName = file.name.replace(/\.[^.]+$/, "") || "receipt";
	const fileName = `${baseName}.jpg`;
	return new File([blob], fileName, {
		type: mimeType,
		lastModified: file.lastModified,
	});
};
