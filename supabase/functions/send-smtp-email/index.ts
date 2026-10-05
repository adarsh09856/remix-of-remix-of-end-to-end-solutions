// Edge function: sends an email via arbitrary SMTP using denomailer.
// Called by server functions with creds loaded from app_settings.

import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Payload {
  smtp: { host: string; port: number; user: string; pass: string; secure?: boolean };
  from: { name?: string; email: string };
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = (await req.json()) as Payload;
    const { smtp, from, to, subject, html, text } = body;
    if (!smtp?.host || !smtp?.user || !smtp?.pass || !from?.email || !to || !subject) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtp.host,
        port: Number(smtp.port) || 587,
        tls: !!smtp.secure,
        auth: { username: smtp.user, password: smtp.pass },
      },
    });

    const fromAddr = from.name ? `${from.name} <${from.email}>` : from.email;
    const recipients = Array.isArray(to) ? to : [to];

    for (const recipient of recipients) {
      await client.send({
        from: fromAddr,
        to: recipient,
        subject,
        content: text ?? subject,
        html,
      });
    }
    await client.close();

    return new Response(JSON.stringify({ ok: true, sent: recipients.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-smtp-email error", e);
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
