import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
}

function priceFor(product: any, code: "BT" | "IN" | "US"): number {
  const base = Number(product.price_inr ?? 0);
  if (code === "IN") return product.price_in == null ? base : Number(product.price_in);
  if (code === "US") return product.price_us == null ? Math.round(base * 0.012 * 100) / 100 : Number(product.price_us);
  return base;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/* ---------------------------------- boot --------------------------------- */

export const posBootstrap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: products }, { data: categories }, { data: session }, { data: settings }] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, name, slug, sku, barcode, unit, image_url, stock, price_inr, price_in, price_us, category_id, is_active, allow_backorder")
        .eq("is_active", true)
        .order("name"),
      supabaseAdmin.from("categories").select("id, name, slug, sort_order").order("sort_order"),
      supabaseAdmin
        .from("pos_sessions")
        .select("*")
        .eq("cashier_id", context.userId)
        .eq("status", "open")
        .order("opened_at", { ascending: false })
        .maybeSingle(),
      supabaseAdmin.from("app_settings").select("value").eq("key", "store").maybeSingle(),
    ]);
    return {
      products: products ?? [],
      categories: categories ?? [],
      session: session ?? null,
      store: (settings?.value as any) ?? {},
    };
  });

/* -------------------------------- sessions -------------------------------- */

export const posOpenSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { openingFloat: number }) => z.object({ openingFloat: z.number().min(0).max(10_000_000) }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin
      .from("pos_sessions")
      .select("id")
      .eq("cashier_id", context.userId)
      .eq("status", "open")
      .maybeSingle();
    if (existing) return { id: existing.id, alreadyOpen: true };
    const { data: row, error } = await supabaseAdmin
      .from("pos_sessions")
      .insert({ cashier_id: context.userId, opening_float: data.openingFloat, status: "open" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id, alreadyOpen: false };
  });

export const posSessionReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => z.object({ sessionId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session } = await supabaseAdmin.from("pos_sessions").select("*").eq("id", data.sessionId).single();
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, total_inr, status, created_at, pos_payments(method, amount)")
      .eq("pos_session_id", data.sessionId);
    const rows = (orders ?? []) as any[];
    const sales = rows.filter((o) => o.status !== "cancelled");
    const byMethod: Record<string, number> = {};
    for (const o of sales) for (const p of o.pos_payments ?? []) byMethod[p.method] = round2((byMethod[p.method] ?? 0) + Number(p.amount));
    const gross = round2(sales.reduce((s, o) => s + Number(o.total_inr), 0));
    const refunded = round2(rows.filter((o) => o.status === "cancelled").reduce((s, o) => s + Number(o.total_inr), 0));
    const expectedCash = round2(Number(session?.opening_float ?? 0) + (byMethod.cash ?? 0));
    return { session, saleCount: sales.length, gross, refunded, byMethod, expectedCash };
  });

export const posCloseSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string; closingCash: number; note?: string | null }) =>
    z
      .object({
        sessionId: z.string().uuid(),
        closingCash: z.number().min(0).max(10_000_000),
        note: z.string().trim().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: session } = await supabaseAdmin.from("pos_sessions").select("*").eq("id", data.sessionId).single();
    if (!session) throw new Error("Session not found");
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("status, pos_payments(method, amount)")
      .eq("pos_session_id", data.sessionId);
    let cash = 0;
    for (const o of (orders ?? []) as any[]) {
      if (o.status === "cancelled") continue;
      for (const p of o.pos_payments ?? []) if (p.method === "cash") cash += Number(p.amount);
    }
    const expected = round2(Number(session.opening_float) + cash);
    const { error } = await supabaseAdmin
      .from("pos_sessions")
      .update({
        status: "closed",
        closing_cash: data.closingCash,
        expected_cash: expected,
        difference: round2(data.closingCash - expected),
        note: data.note ?? null,
        closed_at: new Date().toISOString(),
      })
      .eq("id", data.sessionId);
    if (error) throw new Error(error.message);
    return { expected, difference: round2(data.closingCash - expected) };
  });

export const posListSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("pos_sessions")
      .select("*")
      .order("opened_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

/* -------------------------------- checkout -------------------------------- */

const CheckoutSchema = z.object({
  sessionId: z.string().uuid().nullable().optional(),
  countryCode: z.enum(["BT", "IN", "US"]).default("BT"),
  currency: z.enum(["BTN", "INR", "USD"]).default("BTN"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(999),
        unitPrice: z.number().min(0).optional(),
      }),
    )
    .min(1),
  discountType: z.enum(["flat", "percent"]).default("flat"),
  discountValue: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  payments: z
    .array(
      z.object({
        method: z.enum(["cash", "card", "qr", "mbob", "bank", "credit", "other"]),
        amount: z.number().min(0),
        reference: z.string().trim().max(120).optional().nullable(),
      }),
    )
    .min(1),
  customerName: z.string().trim().max(120).optional().nullable(),
  customerPhone: z.string().trim().max(40).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export const posCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CheckoutSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const ids = data.items.map((i) => i.productId);
    const { data: products, error: prodErr } = await supabaseAdmin
      .from("products")
      .select("id, name, image_url, stock, price_inr, price_in, price_us, allow_backorder")
      .in("id", ids);
    if (prodErr) throw new Error(prodErr.message);
    const map = new Map((products ?? []).map((p: any) => [p.id, p]));

    const lines = data.items.map((item) => {
      const product: any = map.get(item.productId);
      if (!product) throw new Error("A product in the cart no longer exists");
      if (!product.allow_backorder && product.stock < item.quantity) {
        throw new Error(`${product.name}: only ${product.stock} left in stock`);
      }
      const unit = item.unitPrice != null ? round2(item.unitPrice) : priceFor(product, data.countryCode);
      return { product, quantity: item.quantity, unit, total: round2(unit * item.quantity) };
    });

    const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
    const discount = round2(
      Math.min(subtotal, data.discountType === "percent" ? (subtotal * data.discountValue) / 100 : data.discountValue),
    );
    const taxable = round2(subtotal - discount);
    const tax = round2((taxable * data.taxRate) / 100);
    const total = round2(taxable + tax);
    const tendered = round2(data.payments.reduce((s, p) => s + p.amount, 0));
    const cashPaid = round2(data.payments.filter((p) => p.method === "cash").reduce((s, p) => s + p.amount, 0));
    const nonCash = round2(tendered - cashPaid);
    if (round2(nonCash + cashPaid) + 0.001 < total && !data.payments.some((p) => p.method === "credit")) {
      throw new Error("Payment is less than the amount due");
    }
    const change = round2(Math.max(0, tendered - total));

    const invoice = `POS-${Date.now().toString(36).toUpperCase()}`;
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: null,
        channel: "pos",
        cashier_id: context.userId,
        pos_session_id: data.sessionId ?? null,
        status: "paid",
        payment_method: data.payments[0].method === "cash" ? "cod" : "manual",
        currency: data.currency,
        country_code: data.countryCode,
        subtotal_inr: subtotal,
        shipping_inr: 0,
        discount_amount: discount,
        manual_discount: discount,
        tax_amount: tax,
        total_inr: total,
        amount_tendered: tendered,
        change_due: change,
        invoice_number: invoice,
        customer_name: data.customerName ?? null,
        customer_phone: data.customerPhone ?? null,
        counter_note: data.note ?? null,
        ship_full_name: data.customerName || "Walk-in customer",
        ship_phone: data.customerPhone ?? null,
        ship_address_line1: "In-store purchase",
        ship_city: "Counter",
        ship_country: "Bhutan",
      })
      .select("*")
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Sale failed");

    const itemRows = lines.map((l) => ({
      order_id: order.id,
      product_id: l.product.id,
      product_name: l.product.name,
      product_image: l.product.image_url,
      unit_price_inr: l.unit,
      quantity: l.quantity,
      line_total_inr: l.total,
    }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemRows);
    if (itemsErr) throw new Error(itemsErr.message);

    await supabaseAdmin.from("pos_payments").insert(
      data.payments
        .filter((p) => p.amount > 0)
        .map((p) => ({
          order_id: order.id,
          method: p.method,
          amount: p.method === "cash" ? round2(Math.min(p.amount, Math.max(0, total - nonCash))) : p.amount,
          reference: p.reference ?? null,
        })),
    );

    // stock + movements
    for (const l of lines) {
      await supabaseAdmin
        .from("products")
        .update({ stock: Math.max(0, Number(l.product.stock) - l.quantity) })
        .eq("id", l.product.id);
      await supabaseAdmin.from("inventory_movements").insert({
        product_id: l.product.id,
        delta: -l.quantity,
        reason: "pos_sale",
        order_id: order.id,
        actor_id: context.userId,
      });
    }

    return {
      order: { ...order, order_items: itemRows },
      totals: { subtotal, discount, tax, total, tendered, change },
    };
  });

/* ---------------------------------- sales --------------------------------- */

export const posListSales = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId?: string | null; search?: string | null } | undefined) =>
    z
      .object({ sessionId: z.string().uuid().nullable().optional(), search: z.string().trim().max(80).nullable().optional() })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select("*, order_items(*), pos_payments(*)")
      .eq("channel", "pos")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.sessionId) q = q.eq("pos_session_id", data.sessionId);
    if (data.search) q = q.or(`invoice_number.ilike.%${data.search}%,customer_name.ilike.%${data.search}%,customer_phone.ilike.%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const posRefundSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; reason?: string | null }) =>
    z.object({ orderId: z.string().uuid(), reason: z.string().trim().max(300).optional().nullable() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, channel, order_items(product_id, quantity)")
      .eq("id", data.orderId)
      .single();
    if (!order || order.channel !== "pos") throw new Error("POS sale not found");
    if (order.status === "cancelled") throw new Error("Already refunded");

    for (const it of (order as any).order_items ?? []) {
      if (!it.product_id) continue;
      const { data: p } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
      if (!p) continue;
      await supabaseAdmin.from("products").update({ stock: Number(p.stock) + it.quantity }).eq("id", it.product_id);
      await supabaseAdmin.from("inventory_movements").insert({
        product_id: it.product_id,
        delta: it.quantity,
        reason: "pos_refund",
        order_id: order.id,
        actor_id: context.userId,
      });
    }
    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        refunded_at: new Date().toISOString(),
        cancelled_at: new Date().toISOString(),
        cancelled_reason: data.reason ?? "POS refund",
      })
      .eq("id", order.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const posDayStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const { data } = await supabaseAdmin
      .from("orders")
      .select("total_inr, status, channel, order_items(quantity)")
      .gte("created_at", since.toISOString());
    const all = ((data ?? []) as any[]).filter((o) => o.status !== "cancelled");
    const sum = (rows: any[]) => round2(rows.reduce((s, o) => s + Number(o.total_inr), 0));
    const unitsOf = (rows: any[]) =>
      rows.reduce((s, o) => s + (o.order_items ?? []).reduce((a: number, i: any) => a + i.quantity, 0), 0);
    const counter = all.filter((o) => o.channel === "pos");
    const online = all.filter((o) => o.channel !== "pos");
    const revenue = sum(all);
    return {
      sales: all.length,
      revenue,
      units: unitsOf(all),
      avg: all.length ? round2(revenue / all.length) : 0,
      counter: { sales: counter.length, revenue: sum(counter) },
      online: { sales: online.length, revenue: sum(online) },
    };
  });

/* ----------------------------- online orders ----------------------------- */

export const posOnlineOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string | null; search?: string | null } | undefined) =>
    z
      .object({
        status: z.enum(["all", "pending", "paid", "fulfilled", "cancelled"]).nullable().optional(),
        search: z.string().trim().max(80).nullable().optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .neq("channel", "pos")
      .order("created_at", { ascending: false })
      .limit(100);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as any);
    if (data.search)
      q = q.or(
        `invoice_number.ilike.%${data.search}%,ship_full_name.ilike.%${data.search}%,ship_phone.ilike.%${data.search}%`,
      );
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const posUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; status: string; courier?: string | null; trackingNumber?: string | null }) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum(["pending", "paid", "fulfilled", "cancelled"]),
        courier: z.string().trim().max(80).nullable().optional(),
        trackingNumber: z.string().trim().max(80).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, order_items(product_id, quantity)")
      .eq("id", data.orderId)
      .single();
    if (!order) throw new Error("Order not found");
    if (order.status === data.status) return { ok: true };

    // cancelling an already-decremented order restocks automatically
    const wasDecremented = order.status === "paid" || order.status === "fulfilled";
    if (data.status === "cancelled" && wasDecremented) {
      for (const it of ((order as any).order_items ?? []) as any[]) {
        if (!it.product_id) continue;
        const { data: p } = await supabaseAdmin.from("products").select("stock").eq("id", it.product_id).maybeSingle();
        if (!p) continue;
        await supabaseAdmin.from("products").update({ stock: Number(p.stock) + it.quantity }).eq("id", it.product_id);
        await supabaseAdmin.from("inventory_movements").insert({
          product_id: it.product_id,
          delta: it.quantity,
          reason: "order_cancelled",
          order_id: order.id,
          actor_id: context.userId,
        });
      }
    }

    const patch: any = { status: data.status };
    if (data.courier !== undefined) patch.courier = data.courier;
    if (data.trackingNumber !== undefined) patch.tracking_number = data.trackingNumber;
    if (data.status === "cancelled") {
      patch.cancelled_at = new Date().toISOString();
      patch.cancelled_reason = "Cancelled from POS";
    }
    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);

    // stock decrement on paid is handled by the database trigger; log the movement
    if (data.status === "paid" && !wasDecremented) {
      for (const it of ((order as any).order_items ?? []) as any[]) {
        if (!it.product_id) continue;
        await supabaseAdmin.from("inventory_movements").insert({
          product_id: it.product_id,
          delta: -it.quantity,
          reason: "online_sale",
          order_id: order.id,
          actor_id: context.userId,
        });
      }
    }
    return { ok: true };
  });

