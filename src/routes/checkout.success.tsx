import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (s) => z.object({ orderId: z.string().uuid().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Order placed — Takin Mart" }] }),
  component: Success,
});

function Success() {
  const { orderId } = Route.useSearch();
  return (
    <div className="container-page py-24 text-center max-w-md mx-auto">
      <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
      <h1 className="font-display text-4xl mt-6">Order Placed!</h1>
      <p className="text-muted-foreground mt-3">
        Thank you for supporting Bhutanese farmers. We'll email you when your order ships.
      </p>
      {orderId && <p className="text-xs text-muted-foreground mt-4">Order #{orderId.slice(0, 8)}</p>}
      <div className="flex gap-3 justify-center mt-8">
        <Link to="/orders" className="btn-hero">View orders</Link>
        <Link to="/shop" className="btn-ghost-hero">Keep shopping</Link>
      </div>
    </div>
  );
}
