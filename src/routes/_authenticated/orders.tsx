import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOrders } from "@/lib/orders.functions";
import { formatByCurrency } from "@/lib/country";
import { Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "My Orders — Takin Mart" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname !== "/orders" ? <Outlet /> : <OrdersList />;
}

function OrdersList() {
  const fetchFn = useServerFn(listMyOrders);
  const { data, isLoading } = useQuery({ queryKey: ["my-orders"], queryFn: () => fetchFn() });

  if (isLoading) return <div className="container-page py-24 text-center">Loading…</div>;
  const orders = data ?? [];

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl mb-8">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">You haven't placed any orders yet.</p>
          <Link to="/shop" className="btn-hero mt-6">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <Link to="/orders/$id" params={{ id: o.id }} key={o.id} className="block bg-card border border-border rounded-2xl p-6 hover:border-primary transition">
              <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">Order {o.invoice_number ?? `#${o.id.slice(0, 8)}`}</div>
                  <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <span className={`text-xs uppercase tracking-wider px-3 py-1 rounded-full font-semibold ${o.status === "paid" || o.status === "fulfilled" ? "bg-primary/10 text-primary" : o.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-gold/15 text-gold-foreground"}`}>
                  {o.status}
                </span>
              </div>
              <ul className="space-y-2 text-sm border-t border-border pt-4">
                {o.order_items.map((it: any) => (
                  <li key={it.id} className="flex justify-between">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span>{formatByCurrency(it.line_total_inr, o.currency)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
                <span className="text-sm text-muted-foreground">{o.tracking_number ? `Tracking: ${o.tracking_number}` : `${(o.payment_method ?? "cod").toUpperCase()} · Ship to: ${o.ship_city}, ${o.ship_country}`}</span>
                <span className="font-semibold text-primary text-lg">{formatByCurrency(o.total_inr, o.currency)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
