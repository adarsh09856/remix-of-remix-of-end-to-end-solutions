import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function ensureAccountRows(userId: string, fullName?: string | null) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, full_name: fullName ?? null }, { onConflict: "id", ignoreDuplicates: true });

  // If no administrator exists in the store yet, promote the very first registrant to admin
  const { count } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  const initialRole = (count === 0 || count === null) ? "admin" : "user";

  await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: userId, role: initialRole }, { onConflict: "user_id,role", ignoreDuplicates: true });
}

const ProfileSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional().nullable(),
  address_line1: z.string().trim().max(200).optional().nullable(),
  address_line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  postal_code: z.string().trim().max(20).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data, error } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      await ensureAccountRows(userId, (context.claims?.user_metadata as any)?.full_name ?? null);
      const res = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      data = res.data;
      error = res.error;
      if (error) throw new Error(error.message);
    }
    return data;
  });

export const ensureMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAccountRows(context.userId, (context.claims?.user_metadata as any)?.full_name ?? null);
    return { ok: true };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data).eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    return !!data;
  });
