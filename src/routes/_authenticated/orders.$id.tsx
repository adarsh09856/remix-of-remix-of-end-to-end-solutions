import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyOrder, cancelMyOrder } from "@/lib/orders.functions";
import { formatByCurrency } from "@/lib/country";
import { resolveAsset } from "@/lib/asset-map";
import { ArrowLeft, Package, Truck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  head: () => ({ meta: [{ title: "Order Detail — Takin Mart" }] }),
  component: OrderDetail,
});

const STEPS = [
  { key: "pending", label: "Order placed", icon: Clock },
  { key: "paid", label: "Payment received", icon: CheckCircle2 },
  { key: "fulfilled", label: "Shipped & delivered", icon: Truck },
];

function OrderDetail() {
  const { id } = Route.useParams();
  const fetchFn = useServerFn(getMyOrder);
  const cancelFn = useServerFn(cancelMyOrder);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: order, isLoading } = useQuery({ queryKey: ["my-order", id], queryFn: () => fetchFn({ data: { id } }) });

  const cancel = useMutation({
    mutationFn: () => cancelFn({ data: { orderId: id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-order", id] });
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success("Order cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="container-page py-24 text-center">Loading…</div>;
  if (!order) return <div className="container-page py-24 text-center">Order not found. <Link to="/orders" className="text-primary">Back</Link></div>;

  const o: any = order;
  const isCancelled = o.status === "cancelled";
  const activeStep = isCancelled ? -1 : STEPS.findIndex((s) => s.key === o.status);

  return (
    <div className="container-page py-12 max-w-4xl">
      <button onClick={() => navigate({ to: "/orders" })} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="h-4 w-4" /> All orders
      </button>

      <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Order</div>
          <h1 className="font-display text-3xl">{o.invoice_number ?? `#${o.id.slice(0, 8)}`}</h1>
          <div className="text-sm text-muted-foreground mt-1">Placed {new Date(o.created_at).toLocaleString()}</div>
        </div>
        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Total</div>
          <div className="font-display text-3xl text-primary">{formatByCurrency(o.total_inr, o.currency)}</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl mb-5 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Delivery Status</h2>
        {isCancelled ? (
          <div className="flex items-center gap-3 text-destructive"><XCircle className="h-5 w-5" /> This order was cancelled.</div>
        ) : (
          <ol className="grid sm:grid-cols-3 gap-4">
            {STEPS.map((s, i) => {
              const done = i <= activeStep;
              const Icon = s.icon;
              return (
                <li key={s.key} className={`p-4 rounded-xl border ${done ? "border-primary/50 bg-primary/5" : "border-border bg-background"}`}>
                  <Icon className={`h-5 w-5 ${done ? "text-primary" : "text-muted-foreground"}`} />
                  <div className={`text-sm font-medium mt-2 ${done ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</div>
                </li>
              );
            })}
          </ol>
        )}

        {(o.courier || o.tracking_number || o.estimated_delivery) && (
          <dl className="grid sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border text-sm">
            {o.courier && <div><dt className="text-xs text-muted-foreground uppercase">Courier</dt><dd className="font-medium">{o.courier}</dd></div>}
            {o.tracking_number && <div><dt className="text-xs text-muted-foreground uppercase">Tracking #</dt><dd className="font-mono">{o.tracking_number}</dd></div>}
            {o.estimated_delivery && <div><dt className="text-xs text-muted-foreground uppercase">Est. delivery</dt><dd className="font-medium">{new Date(o.estimated_delivery).toLocaleDateString()}</dd></div>}
          </dl>
        )}
        {o.admin_notes && <p className="mt-4 text-sm text-muted-foreground italic">Note: {o.admin_notes}</p>}
      </div>

      {/* Items */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <h2 className="font-display text-xl mb-4">Items</h2>
        <ul className="divide-y divide-border">
          {o.order_items.map((it: any) => (
            <li key={it.id} className="flex gap-4 py-4">
              {it.product_image && <img src={resolveAsset(it.product_image)} alt="" className="h-16 w-16 rounded-lg object-contain bg-white" />}
              <div className="flex-1">
                <div className="font-medium">{it.product_name}</div>
                <div className="text-sm text-muted-foreground">Qty {it.quantity} · {formatByCurrency(it.unit_price_inr, o.currency)}</div>
              </div>
              <div className="font-semibold">{formatByCurrency(it.line_total_inr, o.currency)}</div>
            </li>
          ))}
        </ul>
        <dl className="mt-4 pt-4 border-t border-border space-y-1.5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatByCurrency(o.subtotal_inr, o.currency)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{Number(o.shipping_inr) === 0 ? "Free" : formatByCurrency(o.shipping_inr, o.currency)}</dd></div>
          <div className="flex justify-between font-semibold text-base pt-2 border-t border-border"><dt>Total</dt><dd className="text-primary">{formatByCurrency(o.total_inr, o.currency)}</dd></div>
        </dl>
      </div>

      {/* Shipping */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-xl mb-3">Shipping address</h2>
          <address className="not-italic text-sm leading-relaxed text-muted-foreground">
            {o.ship_full_name}<br />
            {o.ship_address_line1}{o.ship_address_line2 ? `, ${o.ship_address_line2}` : ""}<br />
            {o.ship_city}{o.ship_state ? `, ${o.ship_state}` : ""} {o.ship_postal_code}<br />
            {o.ship_country}<br />
            📞 {o.ship_phone}
          </address>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-display text-xl mb-3">Payment</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Method</dt><dd className="font-medium uppercase">{o.payment_method ?? "cod"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Status</dt><dd className="font-medium capitalize">{o.status}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Invoice</dt><dd className="font-medium">{o.invoice_number ?? "Pending"}</dd></div>
            {o.razorpay_payment_id && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Payment ID</dt><dd className="font-mono text-xs">{o.razorpay_payment_id}</dd></div>}
          </dl>
        </div>
      </div>

      {o.status === "pending" && (
        <button onClick={() => cancel.mutate()} disabled={cancel.isPending} className="text-sm text-destructive hover:underline">
          {cancel.isPending ? "Cancelling…" : "Cancel this order"}
        </button>
      )}
    </div>
  );
}
