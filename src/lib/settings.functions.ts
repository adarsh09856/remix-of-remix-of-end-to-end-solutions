import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
}

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await context.supabase.from("app_settings").select("*");
    if (error) throw new Error(error.message);
    const out: Record<string, any> = {};
    (data ?? []).forEach((r: any) => { out[r.key] = r.value; });
    return out;
  });

export const updateAdminSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { key: string; value: unknown }) =>
    z.object({ key: z.string().min(1).max(60), value: z.any() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await context.supabase
      .from("app_settings")
      .upsert({ key: data.key, value: data.value, updated_by: context.userId, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string }) => z.object({ to: z.string().email() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);
    const { sendTxEmail, brandedEmail } = await import("@/lib/email.server");
    const html = brandedEmail({
      title: "SMTP test successful",
      intro: "If you're reading this in your inbox, your Takin Mart SMTP settings are working correctly.",
      footer: "Test email from Takin Mart admin panel",
    });
    const res = await sendTxEmail({ to: data.to, subject: "Takin Mart SMTP test", html });
    return res;
  });

// Public-safe settings (store info + shipping rules; no SMTP / payment keys)
export const getPublicSettings = createServerFn({ method: "GET" })
  .handler(async () => {
    const { createClient } = await import("@supabase/supabase-js");
    const c = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await c.from("app_settings").select("key, value").in("key", ["store", "shipping", "payments"]);
    const out: Record<string, any> = {};
    (data ?? []).forEach((r: any) => { out[r.key] = r.value; });
    // strip sensitive payment internals before this public payload reaches checkout
    const payments = out.payments ?? {};
    out.payments = {
      cod_enabled: payments.cod_enabled !== false,
      manual_enabled: !!payments.manual_enabled,
      manual_title: payments.manual_title ?? "Manual payment",
      manual_instructions: payments.manual_instructions ?? "",
      razorpay_enabled: !!payments.razorpay_enabled,
      razorpay_mode: payments.razorpay_mode ?? "test",
      razorpay_key_id: payments.razorpay_key_id ?? "",
      whatsapp_enabled: !!payments.whatsapp_enabled,
      whatsapp_number: payments.whatsapp_number ?? "",
      whatsapp_title: payments.whatsapp_title ?? "Pay via WhatsApp",
      whatsapp_instructions: payments.whatsapp_instructions ?? "After placing your order, we'll open WhatsApp so you can confirm payment with our team.",
      paypal_enabled: !!payments.paypal_enabled,
      paypal_mode: payments.paypal_mode ?? "sandbox",
      paypal_title: payments.paypal_title ?? "PayPal",
    };
    return out;
  });
