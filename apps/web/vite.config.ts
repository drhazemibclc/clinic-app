import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), tanstackStart(), viteReact()],
  server: {
    port: 3001,
    hmr: {
      timeout: 120000,
    },
  },
  ssr: {
    noExternal: ["better-auth", "@orpc/client"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    exclude: [
      "@tanstack/react-start",
      "@tanstack/react-start-server",
      "@tanstack/start-client-core",
      "@orpc/client",
    ],
  },
  css: {
    devSourcemap: false,
  },
  build: {
    sourcemap: true,
  },
});
