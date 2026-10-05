import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getCart = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, quantity, product:products(id, name, slug, price_inr, unit, image_url, stock)")
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addToCart = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; quantity?: number }) =>
    z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99).optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const qty = data.quantity ?? 1;
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", userId)
      .eq("product_id", data.productId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: Math.min(99, existing.quantity + qty) })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("cart_items")
        .insert({ user_id: userId, product_id: data.productId, quantity: qty });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const updateCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; quantity: number }) =>
    z.object({ id: z.string().uuid(), quantity: z.number().int().min(1).max(99) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: data.quantity })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeCartItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("cart_items").delete().eq("id", data.id).eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getCartCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", userId);
    return (data ?? []).reduce((s, r) => s + r.quantity, 0);
  });
