// vite.config.ts
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitroV2Plugin } from "@tanstack/nitro-v2-vite-plugin";
import viteReact from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	server: {
		port: 3000,
		proxy: {
			"/ingest/static": {
				target: "https://us-assets.i.posthog.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/ingest/, ""),
			},
			"/ingest/array": {
				target: "https://us-assets.i.posthog.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/ingest/, ""),
			},
			"/ingest": {
				target: "https://us.i.posthog.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/ingest/, ""),
			},
		},
	},
	assetsInclude: ["**/*.wasm"],
	optimizeDeps: {
		include: ["heic2any", "heic-to"],
	},
	plugins: [
		tailwindcss(),
		// Enables Vite to resolve imports using path aliases.
		tsconfigPaths(),
		tanstackStart({
			srcDirectory: "src", // This is the default
			router: {
				// Specifies the directory TanStack Router uses for your routes.
				routesDirectory: "app", // Defaults to "routes", relative to srcDirectory
			},
		}),
		// Nitro plugin for optimized deployment and better SSR support
		nitroV2Plugin({
			preset: "vercel", // Optimize for Vercel deployment
			routeRules: {
				"/ingest/static/**": {
					proxy: "https://us-assets.i.posthog.com/static/**",
				},
				"/ingest/array/**": {
					proxy: "https://us-assets.i.posthog.com/array/**",
				},
				"/ingest/**": {
					proxy: "https://us.i.posthog.com/**",
				},
			},
		}),
		viteReact(),
	],
});
