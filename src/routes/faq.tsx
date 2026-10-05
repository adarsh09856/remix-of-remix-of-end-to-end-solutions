import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Takin Mart" },
      { name: "description", content: "Common questions about Takin Mart products, shipping, returns and our sourcing process." },
      { property: "og:title", content: "FAQ — Takin Mart" },
      { property: "og:description", content: "Common questions about our Bhutanese agro products and orders." },
    ],
  }),
  component: FAQPage,
});

const faqs = [
  ["Where do you ship?", "We currently ship across Bhutan only. International shipping is coming soon — sign up to our newsletter to be the first to know. International shipping is coming soon — sign up to our newsletter to be the first to know."],
  ["How long does delivery take?", "Delivery across Bhutan takes 2–5 business days depending on your dzongkhag. You'll get a tracking link as soon as your order ships."],
  ["Are your products organic?", "Yes — Bhutan adopted organic-by-default farming as national policy. Every Takin Mart product is sourced from farmers using traditional, chemical-free methods."],
  ["What's your return policy?", "If anything arrives damaged or doesn't meet your expectations, contact us within 7 days for a free replacement or full refund."],
  ["Do you work with restaurants or wholesalers?", "Yes — for bulk and wholesale enquiries, please reach out via our contact page with quantities and a delivery address."],
  ["How is the wild honey collected?", "Our honey is gathered by traditional Bhutanese bee-keepers and cliff harvesters. It is raw, unfiltered, never heated, and contains no additives."],
];

function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="container-page py-16 max-w-3xl">
      <div className="text-center">
        <span className="eyebrow">Help center</span>
        <h1 className="font-display text-5xl mt-2">Frequently Asked Questions</h1>
      </div>
      <div className="mt-10 space-y-3">
        {faqs.map(([q, a], i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between p-5 text-left font-medium">
              <span>{q}</span>
              <ChevronDown className={`h-5 w-5 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-5 pb-5 text-muted-foreground text-sm leading-relaxed">{a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
