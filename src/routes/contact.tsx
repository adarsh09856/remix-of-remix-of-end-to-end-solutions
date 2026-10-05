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
        <h1 className="font-display text-5xl mt-2">Contact</h1>
        <p className="text-muted-foreground mt-3">Questions, partnerships, wholesale — we'd love to hear from you.</p>
      </div>

      <div className="mt-12 grid lg:grid-cols-2 gap-10 max-w-4xl mx-auto">
        <div className="space-y-6">
          {[
            { I: Phone, t: "Phone", d: "+975 17 17 17 17" },
            { I: Mail, t: "Email", d: "hello@takinmart.bt" },
            { I: MapPin, t: "Address", d: "Thimphu, Bhutan" },
          ].map(({ I, t, d }) => (
            <div key={t} className="flex gap-4 items-start bg-card border border-border rounded-2xl p-6">
              <div className="h-11 w-11 rounded-full bg-secondary grid place-items-center shrink-0">
                <I className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t}</h3>
                <p className="text-muted-foreground text-sm mt-1">{d}</p>
              </div>
            </div>
          ))}
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
