import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

function stripPreviewSourceMarkers(): Plugin {
  return {
    name: "drukharvest:strip-preview-source-markers",
    apply: "serve",
    enforce: "post",
    transform(code, id) {
      if (!code.includes("data-tsd-source") || !/\.[cm]?[jt]sx?(?:\?|$)/.test(id)) return null;

      return {
        code: code
          .replace(/,\s*"data-tsd-source":\s*"[^"]*"/g, "")
          .replace(/"data-tsd-source":\s*"[^"]*",\s*/g, ""),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [stripPreviewSourceMarkers()],

  nitro: {
    preset: process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : "node-server"),
  },

  tanstackStart: {
    server: {
      entry: "server",
    },
  },

  vite: {
    server: {
      allowedHosts: [
        "complete-end-to-end.onrender.com",
        "localhost",
        "127.0.0.1",
        ".onrender.com", // Wildcard for any Render subdomain
      ],
    },
  },
});
