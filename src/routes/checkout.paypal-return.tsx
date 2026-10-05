import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { capturePaypalOrder } from "@/lib/paypal.functions";
import { clearLocalCart } from "@/lib/local-cart";
import { Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/paypal-return")({
  validateSearch: (s) => z.object({ orderId: z.string().uuid() }).parse(s),
  head: () => ({
    meta: [
      { title: "Confirming your PayPal payment — Takin Mart" },
      { name: "description", content: "We are confirming your PayPal payment and finalising your Takin Mart order." },
      { property: "og:title", content: "Confirming your PayPal payment — Takin Mart" },
      { property: "og:description", content: "Finalising your Takin Mart order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaypalReturn,
});

function PaypalReturn() {
  const { orderId } = Route.useSearch();
  const navigate = useNavigate();
  const capture = useServerFn(capturePaypalOrder);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    capture({ data: { orderId } })
      .then(() => {
        clearLocalCart();
        navigate({ to: "/checkout/success", search: { orderId } });
      })
      .catch((e: Error) => setError(e.message));
  }, [orderId, capture, navigate]);

  if (error) {
    return (
      <div className="container-page py-24 text-center max-w-md mx-auto">
        <XCircle className="h-14 w-14 text-destructive mx-auto" />
        <h1 className="font-display text-3xl mt-6">Payment not confirmed</h1>
        <p className="text-muted-foreground mt-3">{error}</p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <Link to="/orders/$id" params={{ id: orderId }} className="btn-hero">View order</Link>
          <Link to="/cart" className="btn-ghost-hero">Back to cart</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-24 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
      <p className="mt-4 text-muted-foreground">Confirming your PayPal payment…</p>
    </div>
  );
}
