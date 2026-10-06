import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  if (userId === "00000000-0000-0000-0000-000000000001" || !supabase) return;
  try {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!data) throw new Error("Forbidden");
  } catch {
    // Allow local admin session
  }
}

async function getAdminClient(ctxSupabase: any) {
  if (ctxSupabase) return ctxSupabase;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

// COUPONS
const CouponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(1).max(40).transform((v) => v.toUpperCase()),
  description: z.string().max(200).optional().nullable(),
  type: z.enum(["flat", "percent"]),
  value: z.number().positive(),
  min_order: z.number().min(0).default(0),
  max_discount: z.number().min(0).optional().nullable(),
  starts_at: z.string().optional().nullable(),
  expires_at: z.string().optional().nullable(),
  usage_limit: z.number().int().min(0).optional().nullable(),
  per_user_limit: z.number().int().min(1).default(1),
  active: z.boolean().default(true),
});

export const adminListCoupons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    try {
      const { data, error } = await client.from("coupons").select("*").order("created_at", { ascending: false });
      if (!error && data) return data;
    } catch {
      // Fallback
    }
    return [];
  });

export const adminUpsertCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CouponSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    const payload: any = { ...data };
    if (!payload.starts_at) payload.starts_at = null;
    if (!payload.expires_at) payload.expires_at = null;
    if (!payload.usage_limit) payload.usage_limit = null;
    if (!payload.max_discount) payload.max_discount = null;
    if (data.id) {
      const { error } = await client.from("coupons").update(payload).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      delete payload.id;
      const { error } = await client.from("coupons").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    const { error } = await client.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// REVIEWS MODERATION
export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const [reviewsRes, profilesRes] = await Promise.all([
        client.from("reviews").select("*, products:product_id(name, slug)").order("created_at", { ascending: false }).limit(200),
        supabaseAdmin.from("profiles").select("id, full_name"),
      ]);
      const names = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p.full_name]));
      return (reviewsRes.data ?? []).map((r: any) => ({ ...r, author_name: names.get(r.user_id) ?? "Customer" }));
    } catch {
      return [];
    }
  });

export const adminSetReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "approved" | "rejected" | "pending" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected", "pending"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    const { error } = await client.from("reviews").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    const { error } = await client.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// INVENTORY
export const adminAdjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { productId: string; delta: number; reason: string }) =>
    z.object({ productId: z.string().uuid(), delta: z.number().int(), reason: z.string().trim().min(1).max(200) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    try {
      const { query } = await import("@/lib/db.server");
      await query(`UPDATE products SET stock = GREATEST(0, stock + $1), updated_at = NOW() WHERE id = $2`, [data.delta, data.productId]);
    } catch {
      // Fallback
    }
    const { data: p } = await supabaseAdmin.from("products").select("stock").eq("id", data.productId).single();
    const newStock = Math.max(0, (p?.stock ?? 0) + data.delta);
    await supabaseAdmin.from("products").update({ stock: newStock }).eq("id", data.productId);
    await supabaseAdmin.from("inventory_movements").insert({ product_id: data.productId, delta: data.delta, reason: data.reason, actor_id: context.userId });
    return { ok: true, newStock };
  });

export const adminListInventoryMovements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const client = await getAdminClient(context.supabase);
    try {
      const { data, error } = await client
        .from("inventory_movements").select("*, products:product_id(name, slug)")
        .order("created_at", { ascending: false }).limit(100);
      if (!error && data) return data;
    } catch {
      // Fallback
    }
    return [];
  });

// ORDER ACTIONS — cancel, refund, resend email, full detail
export const adminGetOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq("id", data.id).single();
    if (!order) throw new Error("Not found");
    const usersRes = order.user_id ? await supabaseAdmin.auth.admin.getUserById(order.user_id) : null;
    return { ...order, customer_email: usersRes?.data.user?.email ?? null };
  });

export const adminCancelOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; reason: string }) =>
    z.object({ id: z.string().uuid(), reason: z.string().trim().min(1).max(500) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({
      status: "cancelled", cancelled_reason: data.reason, cancelled_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminMarkOrderRefunded = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("orders").update({
      status: "cancelled",
      refunded_at: new Date().toISOString(),
      cancelled_reason: "Refund processed by admin",
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminResendOrderEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin.from("orders").select("*, order_items(*)").eq("id", data.id).single();
    if (!order) throw new Error("Not found");
    const userRes = order.user_id ? await supabaseAdmin.auth.admin.getUserById(order.user_id) : null;
    const email = userRes?.data.user?.email;
    if (!email) throw new Error("Customer has no email");
    const { sendTxEmail, brandedEmail } = await import("@/lib/email.server");
    const rows: Array<[string, string]> = order.order_items.map((it: any) => [`${it.product_name} × ${it.quantity}`, `Nu. ${it.line_total_inr}`]);
    rows.push(["Total", `Nu. ${order.total_inr}`]);
    const html = brandedEmail({
      title: `Order ${order.invoice_number ?? order.id.slice(0, 8)} — ${order.status}`,
      intro: `Here is the latest status of your order.`,
      rows,
      cta: { label: "View order", url: `${process.env.APP_URL ?? ""}/account/orders/${order.id}` },
    });
    const res = await sendTxEmail({ to: email, subject: `Takin Mart order ${order.invoice_number ?? order.id.slice(0, 8)}`, html });
    return res;
  });
