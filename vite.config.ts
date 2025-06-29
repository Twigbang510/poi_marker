import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
// import { VitePWA, VitePWAOptions } from "vite-plugin-pwa";

// const manifestForPlugin: Partial<VitePWAOptions> = {
//   includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
//   manifest: {
//     name: "POI Marker",
//     short_name: "POI Marker",
//     description: "POI Marker",
//     theme_color: "#ffffff",
//     background_color: "#ffffff",
//     display: "standalone",
//     display_override: ["standalone"],
//     start_url: "/",
//     scope: "/",
//     orientation: "portrait",
//     icons: [
//       {
//         src: "icons/aiaivn-192x192.png",
//         sizes: "192x192",
//         type: "image/png",
//       },
//       {
//         src: "icons/aiaivn-512x512.png",
//         sizes: "512x512",
//         type: "image/png",
//       },
//     ],
//     screenshots: [
//       {
//         src: "screenshot1.png",
//         sizes: "1080x1920",
//         type: "image/png",
//       },
//     ],
//   },
//   devOptions: { enabled: true },
// };

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
});
