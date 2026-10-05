import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * PayPal gateway. Credentials are entered by the store owner in
 * Admin → Settings → Payments and stored in app_settings.payments.
 * Nothing is hardcoded here.
 */
async function getPaypalConfig() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("value").eq("key", "payments").maybeSingle();
  const p: any = data?.value ?? {};
  if (!p.paypal_enabled) throw new Error("PayPal is not enabled for this store");
  const clientId = String(p.paypal_client_id ?? "").trim();
  const secret = String(p.paypal_client_secret ?? "").trim();
  if (!clientId || !secret) throw new Error("PayPal credentials are not configured yet");
  const base = p.paypal_mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  return { clientId, secret, base };
}

async function paypalToken(cfg: { clientId: string; secret: string; base: string }) {
  const res = await fetch(`${cfg.base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${cfg.clientId}:${cfg.secret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const json: any = await res.json();
  if (!res.ok) throw new Error(json?.error_description ?? "PayPal authentication failed");
  return json.access_token as string;
}

// PayPal settles in USD for this store. Rough parity with the storefront FX table.
function toUsd(amount: number, currency: string) {
  const cur = (currency || "BTN").toUpperCase();
  if (cur === "USD") return Math.round(amount * 100) / 100;
  return Math.round(amount * 0.012 * 100) / 100;
}

export const createPaypalOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string; returnUrl: string; cancelUrl: string }) =>
    z.object({
      orderId: z.string().uuid(),
      returnUrl: z.string().url().max(500),
      cancelUrl: z.string().url().max(500),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("id, total_inr, currency, status")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.status !== "pending") throw new Error("This order is already processed");

    const cfg = await getPaypalConfig();
    const token = await paypalToken(cfg);
    const value = toUsd(Number(order.total_inr), order.currency).toFixed(2);

    const res = await fetch(`${cfg.base}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: order.id,
          custom_id: order.id,
          amount: { currency_code: "USD", value },
        }],
        application_context: {
          brand_name: "Takin Mart",
          user_action: "PAY_NOW",
          return_url: data.returnUrl,
          cancel_url: data.cancelUrl,
        },
      }),
    });
    const json: any = await res.json();
    if (!res.ok) throw new Error(json?.message ?? "Could not start PayPal checkout");

    const approve = (json.links ?? []).find((l: any) => l.rel === "approve")?.href;
    if (!approve) throw new Error("PayPal did not return an approval link");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ paypal_order_id: json.id }).eq("id", order.id);

    return { approveUrl: approve as string, paypalOrderId: json.id as string };
  });

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, paypal_order_id")
      .eq("id", data.orderId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!order) throw new Error("Order not found");
    if (order.status === "paid") return { ok: true, alreadyPaid: true };
    if (!order.paypal_order_id) throw new Error("No PayPal session for this order");

    const cfg = await getPaypalConfig();
    const token = await paypalToken(cfg);
    const res = await fetch(`${cfg.base}/v2/checkout/orders/${order.paypal_order_id}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const json: any = await res.json();
    if (!res.ok || json.status !== "COMPLETED") {
      throw new Error(json?.message ?? "PayPal payment was not completed");
    }

    const captureId = json?.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ status: "paid", paypal_capture_id: captureId }).eq("id", order.id);
    await supabase.from("cart_items").delete().eq("user_id", userId);

    return { ok: true, alreadyPaid: false };
  });
