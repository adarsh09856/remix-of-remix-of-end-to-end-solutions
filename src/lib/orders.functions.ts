import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ShippingSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(5).max(30),
  address_line1: z.string().trim().min(3).max(200),
  address_line2: z.string().trim().max(200).optional().nullable(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(100).optional().nullable(),
  postal_code: z.string().trim().max(20),
  country: z.string().trim().max(100).optional().default("Bhutan"),
  country_code: z.enum(["BT", "IN", "US"]).default("BT"),
  currency: z.enum(["BTN", "INR", "USD"]).default("BTN"),
  payment_method: z.enum(["cod", "manual", "razorpay", "whatsapp", "paypal"]).default("cod"),
  coupon_code: z.string().trim().max(40).optional().nullable(),
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1),
});

function priceFor(product: any, code: "BT" | "IN" | "US"): number {
  const base = Number(product.price_inr ?? 0);
  if (code === "IN") return product.price_in == null ? base : Number(product.price_in);
  if (code === "US") return product.price_us == null ? base : Number(product.price_us);
  return base;
}

async function assertPaymentMethodEnabled(method: "cod" | "manual" | "razorpay" | "whatsapp" | "paypal") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "payments").maybeSingle();
  const payments: any = data?.value ?? {};
  const enabled = {
    cod: payments.cod_enabled !== false,
    manual: !!payments.manual_enabled,
    razorpay: !!payments.razorpay_enabled,
    whatsapp: !!payments.whatsapp_enabled,
    paypal: !!payments.paypal_enabled,
  }[method];

  if (!enabled) throw new Error("That payment method is not available right now");
}

async function getShippingSettings() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "shipping").maybeSingle();
  const shipping: any = data?.value ?? {};
  return {
    freeOver: Number(shipping.free_threshold_inr ?? shipping.free_over ?? 1500),
    flatRate: Number(shipping.flat_rate_inr ?? shipping.flat_rate ?? 99),
  };
}

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ShippingSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const shippingCountry = data.country || "Bhutan";
    await assertPaymentMethodEnabled(data.payment_method);
    const productIds = data.items.map((item) => item.productId);
    const { data: products, error: productsErr } = await supabase
      .from("products")
      .select("id, name, price_inr, price_in, price_us, image_url, stock")
      .in("id", productIds)
      .eq("is_active", true);
    if (productsErr) throw new Error(productsErr.message);
    const productMap = new Map((products ?? []).map((product: any) => [product.id, product]));
    const items = data.items.map((item) => ({ quantity: item.quantity, product: productMap.get(item.productId) }));
    if (items.some((item) => !item.product)) throw new Error("One or more products are unavailable");
    if (items.some((item: any) => item.product.stock < item.quantity)) throw new Error("One or more products are out of stock");

    const subtotal = items.reduce(
      (s, it: any) => s + priceFor(it.product, data.country_code) * it.quantity,
      0,
    );
    const shippingSettings = await getShippingSettings();
    const shipping = subtotal >= shippingSettings.freeOver ? 0 : shippingSettings.flatRate;

    // Coupon — always re-validated server side, never trusted from the client
    let discount = 0;
    let couponRow: any = null;
    if (data.coupon_code) {
      const code = data.coupon_code.trim().toUpperCase();
      const { data: c } = await supabase.from("coupons").select("*").ilike("code", code).maybeSingle();
      const now = new Date();
      const valid =
        c && c.active &&
        !(c.starts_at && new Date(c.starts_at) > now) &&
        !(c.expires_at && new Date(c.expires_at) < now) &&
        subtotal >= Number(c.min_order) &&
        !(c.usage_limit && c.used_count >= c.usage_limit);
      if (!valid) throw new Error("Coupon is not valid for this order");
      const { count } = await supabase
        .from("coupon_redemptions").select("id", { count: "exact", head: true })
        .eq("coupon_id", c!.id).eq("user_id", userId);
      if ((count ?? 0) >= c!.per_user_limit) throw new Error("You have already used this coupon");
      let d = c!.type === "percent" ? (subtotal * Number(c!.value)) / 100 : Number(c!.value);
      if (c!.max_discount) d = Math.min(d, Number(c!.max_discount));
      discount = Math.round(Math.min(d, subtotal) * 100) / 100;
      couponRow = c;
    }

    const total = Math.max(0, subtotal - discount) + shipping;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        payment_method: data.payment_method,
        currency: data.currency,
        country_code: data.country_code,
        subtotal_inr: subtotal,
        shipping_inr: shipping,
        discount_amount: discount,
        coupon_code: couponRow?.code ?? null,
        total_inr: total,
        ship_full_name: data.full_name,
        ship_phone: data.phone,
        ship_address_line1: data.address_line1,
        ship_address_line2: data.address_line2,
        ship_city: data.city,
        ship_state: data.state,
        ship_postal_code: data.postal_code,
        ship_country: shippingCountry,
        address_snapshot: {
          full_name: data.full_name,
          phone: data.phone,
          address_line1: data.address_line1,
          address_line2: data.address_line2,
          city: data.city,
          state: data.state,
          postal_code: data.postal_code,
          country: shippingCountry,
          country_code: data.country_code,
          currency: data.currency,
        },
      })
      .select("id")
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Order failed");

    const itemRows = items.map((it: any) => {
      const unit = priceFor(it.product, data.country_code);
      return {
        order_id: order.id,
        product_id: it.product.id,
        product_name: it.product.name,
        product_image: it.product.image_url,
        unit_price_inr: unit,
        quantity: it.quantity,
        line_total_inr: unit * it.quantity,
      };
    });
    const { error: itemsErr } = await supabase.from("order_items").insert(itemRows);
    if (itemsErr) throw new Error(itemsErr.message);

    if (couponRow) {
      await supabase.from("coupon_redemptions").insert({ coupon_id: couponRow.id, user_id: userId, order_id: order.id });
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.rpc("increment_coupon_usage", { _coupon_id: couponRow.id });
    }

    return { orderId: order.id, total, discount };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: order, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });

export const completeOrderMock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", data.orderId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    await supabase.from("cart_items").delete().eq("user_id", userId);
    return { ok: true };
  });

export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
