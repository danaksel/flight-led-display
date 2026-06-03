import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname),
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, "../public"),
    emptyOutDir: false
  }
});
