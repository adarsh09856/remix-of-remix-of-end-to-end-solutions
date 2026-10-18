import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { crmSubmitEnquiry } from "@/lib/crm.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Takin Mart" },
      { name: "description", content: "Get in touch with Takin Mart. We're happy to help with orders, partnerships, and questions about our Bhutanese products." },
      { property: "og:title", content: "Contact — Takin Mart" },
      { property: "og:description", content: "Talk to our team about orders, wholesale or our story." },
    ],
  }),
  component: ContactPage,
});

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(5).max(2000),
});

function ContactPage() {
  const [f, setF] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const send = useServerFn(crmSubmitEnquiry);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(f);
    if (!parsed.success) return toast.error("Please check the form");
    setSending(true);
    try {
      await send({ data: { name: parsed.data.name, email: parsed.data.email, message: parsed.data.message, subject: "Website contact" } });
      toast.success("Thanks! We'll be in touch soon.");
      setF({ name: "", email: "", message: "" });
    } catch {
      toast.error("Could not send. Please try again.");
    } finally {
      setSending(false);
    }
  }
  const input = "w-full bg-card border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary";
  return (
    <div className="container-page py-16">
      <div className="text-center max-w-xl mx-auto">
        <span className="eyebrow">Get in touch</span>
        <h1 className="font-display text-3xl sm:text-5xl mt-2 font-bold">Contact</h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-2 sm:mt-3">Questions, partnerships, wholesale — we'd love to hear from you.</p>
      </div>

      <div className="mt-8 sm:mt-12 grid lg:grid-cols-2 gap-6 sm:gap-10 max-w-5xl mx-auto">
        <div className="space-y-4 sm:space-y-6">
          <div className="flex gap-3.5 sm:gap-4 items-start bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-soft">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-secondary grid place-items-center shrink-0">
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base">Phone & WhatsApp Desks</h3>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                24/7 Official WhatsApp: <a href="https://wa.me/918514889385" target="_blank" rel="noreferrer" className="font-semibold text-emerald-600 hover:underline">+91-8514889385</a>
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Bhutan HQ Operations: <a href="tel:+97517970050" className="font-semibold text-foreground hover:underline">+975-1797-0050</a>
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                United Kingdom Desk: <a href="tel:+447586203728" className="font-semibold text-foreground hover:underline">+44-7586203728</a>
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                Australia Support Desk: <a href="tel:+61404343370" className="font-semibold text-foreground hover:underline">+61-404-343-370</a>
              </p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-secondary grid place-items-center shrink-0">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm sm:text-base">Official Departmental Inboxes</h3>
                <p className="text-[11px] sm:text-xs text-muted-foreground">Direct contact with each division at Takin Mart</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              {[
                { label: "General & Product Inquiries", email: "info@takinmart.bt" },
                { label: "24/7 Orders & Support", email: "support@takinmart.bt" },
                { label: "Operations & Warehouse", email: "office@takinmart.bt" },
                { label: "Wholesale & B2B Partners", email: "bdm@takinmart.bt" },
                { label: "General Manager Escalations", email: "gm@takinmart.bt" },
                { label: "Executive Leadership", email: "ceo@takinmart.bt" },
              ].map(({ label, email }) => (
                <div key={email} className="rounded-xl border border-border/70 p-2.5 sm:p-3 bg-secondary/20">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate">{label}</div>
                  <a href={`mailto:${email}`} className="text-xs font-bold text-primary hover:underline mt-0.5 block truncate">
                    {email}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3.5 sm:gap-4 items-start bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-soft">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-secondary grid place-items-center shrink-0">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Bhutan Head Office</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Takin Mart Agro Hub, Norzin Lam 2, Post Box 1100, Thimphu, Kingdom of Bhutan
              </p>
            </div>
          </div>
        </div>
        <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <input className={input} required maxLength={120} placeholder="Your name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className={input} required type="email" maxLength={200} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <textarea className={input} required rows={6} maxLength={2000} placeholder="How can we help?" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
          <button className="btn-hero w-full" disabled={sending}>{sending ? "Sending…" : "Send message"}</button>
        </form>
      </div>
    </div>
  );
}
