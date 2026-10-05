// Server-only helper to send transactional emails via the SMTP creds saved in app_settings.
// Never import this from client modules.
import { createClient } from "@supabase/supabase-js";

type SmtpCfg = { host: string; port: number; user: string; pass: string; from_name?: string; from_email?: string; secure?: boolean };
type StoreCfg = { name?: string; support_email?: string };

export async function sendTxEmail(opts: { to: string | string[]; subject: string; html: string; text?: string }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("app_settings").select("key, value").in("key", ["smtp", "store"]);
  const smtp = (data?.find((r) => r.key === "smtp")?.value ?? {}) as SmtpCfg;
  const store = (data?.find((r) => r.key === "store")?.value ?? {}) as StoreCfg;
  if (!smtp.host || !smtp.user || !smtp.pass) {
    console.warn("[email] SMTP not configured, skipping send to", opts.to);
    return { ok: false, skipped: true };
  }
  const fromEmail = smtp.from_email || smtp.user;
  const fromName = smtp.from_name || store.name || "Takin Mart";

  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const client = createClient(url, key);
  const { data: res, error } = await client.functions.invoke("send-smtp-email", {
    body: { smtp, from: { name: fromName, email: fromEmail }, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text },
  });
  if (error) {
    console.error("[email] invoke error", error);
    return { ok: false, error: error.message };
  }
  return res ?? { ok: true };
}

export function brandedEmail(opts: { title: string; intro: string; cta?: { label: string; url: string }; rows?: Array<[string, string]>; footer?: string }) {
  const rows = (opts.rows ?? []).map(([k, v]) => `<tr><td style="padding:6px 0;color:#666;font-size:13px">${k}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px">${v}</td></tr>`).join("");
  const cta = opts.cta ? `<a href="${opts.cta.url}" style="display:inline-block;background:#1f4d3a;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-weight:600;margin-top:18px">${opts.cta.label}</a>` : "";
  return `<!doctype html><html><body style="margin:0;background:#faf7f0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1a1a1a">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f0;padding:32px 0">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:18px;overflow:hidden;border:1px solid #ece6d8">
          <tr><td style="padding:28px 32px;background:#1f4d3a;color:#fff;font-family:Georgia,serif;font-size:22px;font-weight:600">Takin<span style="color:#d4a437"> Mart</span></td></tr>
          <tr><td style="padding:32px">
            <h1 style="font-family:Georgia,serif;font-size:24px;margin:0 0 12px">${opts.title}</h1>
            <p style="line-height:1.6;margin:0 0 14px;color:#333">${opts.intro}</p>
            ${rows ? `<table width="100%" style="margin-top:16px;border-top:1px solid #ece6d8;padding-top:8px">${rows}</table>` : ""}
            ${cta}
          </td></tr>
          <tr><td style="padding:18px 32px;background:#faf7f0;color:#999;font-size:12px;text-align:center">${opts.footer ?? "Authentic Bhutanese agro products."} · You received this because an order was placed at Takin Mart.</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}
