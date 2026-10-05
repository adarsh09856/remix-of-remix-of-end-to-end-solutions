import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const ImageQuerySchema = z.object({
  path: z
    .string()
    .min(1)
    .max(500)
    .refine((value) => !value.startsWith("/") && !value.includes("..") && !/[\\\\]/.test(value), "Invalid image path"),
});

export const Route = createFileRoute("/api/public/product-image")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = ImageQuerySchema.safeParse({ path: url.searchParams.get("path") ?? "" });

        if (!parsed.success) {
          return new Response("Invalid image path", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("products").download(parsed.data.path);

        if (error || !data) {
          return new Response("Image not found", { status: 404 });
        }

        return new Response(data, {
          headers: {
            "content-type": data.type || "application/octet-stream",
            "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        });
      },
    },
  },
});