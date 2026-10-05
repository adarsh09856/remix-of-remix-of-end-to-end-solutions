import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CouponResult = { ok: true; code: string; type: "flat" | "percent"; discount: number; couponId: string } | { ok: false; error: string };

export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { code: string; subtotal: number }) =>
    z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().min(0) }).parse(d),
  )
  .handler(async ({ context, data }): Promise<CouponResult> => {
    const { supabase, userId } = context;
    const code = data.code.trim().toUpperCase();
    const { data: c } = await supabase.from("coupons").select("*").ilike("code", code).maybeSingle();
    if (!c || !c.active) return { ok: false, error: "Invalid code" };
    const now = new Date();
    if (c.starts_at && new Date(c.starts_at) > now) return { ok: false, error: "Coupon not yet active" };
    if (c.expires_at && new Date(c.expires_at) < now) return { ok: false, error: "Coupon expired" };
    if (data.subtotal < Number(c.min_order)) return { ok: false, error: `Minimum order Nu. ${c.min_order}` };
    if (c.usage_limit && c.used_count >= c.usage_limit) return { ok: false, error: "Coupon fully redeemed" };
    const { count } = await supabase.from("coupon_redemptions").select("id", { count: "exact", head: true })
      .eq("coupon_id", c.id).eq("user_id", userId);
    if ((count ?? 0) >= c.per_user_limit) return { ok: false, error: "Already used by you" };
    let discount = c.type === "percent" ? (data.subtotal * Number(c.value)) / 100 : Number(c.value);
    if (c.max_discount) discount = Math.min(discount, Number(c.max_discount));
    discount = Math.min(discount, data.subtotal);
    return { ok: true, code: c.code, type: c.type as "flat" | "percent", discount: Math.round(discount * 100) / 100, couponId: c.id };
  });
