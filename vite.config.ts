import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./")
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        interactive: path.resolve(__dirname, "interactive.html"),
        onepage: path.resolve(__dirname, "onepage.html"),
        scroll: path.resolve(__dirname, "scroll.html")
      }
    }
  },
  server: {
    port: 5173,
    host: "127.0.0.1"
  },
  preview: {
    port: 5173,
    host: "127.0.0.1"
  }
});
