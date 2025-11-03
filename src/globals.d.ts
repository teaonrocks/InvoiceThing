declare module "*.css?url" {
	const content: string;
	export default content;
}

// You might also need a general declaration for other CSS imports
declare module "*.css" {
	const content: Record<string, string>;
	export default content;
}
