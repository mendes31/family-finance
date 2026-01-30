import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/family_finance/",
  server: {
    host: "::",
    port: 8080,
    // Para desenvolvimento local ainda usar porta 8080
    // Para produção, fazer build e servir via Apache
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    // Configuração para servir via Apache
    emptyOutDir: true,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
