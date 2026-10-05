import { resolveAsset } from "@/lib/asset-map";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { removeLocalCartItem, updateLocalCartItem, useLocalCart } from "@/lib/local-cart";
import { getPublicSettings } from "@/lib/settings.functions";
import { formatMoney, pickPrice, useCountry } from "@/lib/country";
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Takin Mart" }] }),
  component: CartPage,
});

function CartPage() {
  const { items: rows, ready } = useLocalCart();
  const [country] = useCountry();
  const fetchSettings = useServerFn(getPublicSettings);
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => fetchSettings() });

  if (!ready) return <div className="container-page py-24 text-center">Loading…</div>;

  if (rows.length === 0) {
    return (
      <div className="container-page py-24 text-center max-w-md mx-auto">
        <ShoppingBag className="h-12 w-12 mx-auto text-primary mb-4" />
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <p className="text-muted-foreground mt-3">Discover authentic flavours from the Himalayas.</p>
        <Link to="/shop" className="btn-hero mt-6">Start shopping</Link>
      </div>
    );
  }

  const subtotal = rows.reduce((s, r: any) => s + pickPrice(r.product, country) * r.quantity, 0);
  const shippingConfig: any = settings?.shipping ?? {};
  const freeOver = Number(shippingConfig.free_threshold_inr ?? shippingConfig.free_over ?? 1500);
  const flatRate = Number(shippingConfig.flat_rate_inr ?? shippingConfig.flat_rate ?? 99);
  const shipping = subtotal >= freeOver ? 0 : flatRate;
  const total = subtotal + shipping;

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl mb-8">Your Cart</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {rows.map((r: any) => (
            <div key={r.id} className="flex gap-4 bg-card border border-border rounded-2xl p-4">
              <Link to="/product/$slug" params={{ slug: r.product.slug }} className="relative h-24 w-24 rounded-xl overflow-hidden product-stage shrink-0">
                {r.product.image_url && <img src={resolveAsset(r.product.image_url)} alt={r.product.name} className="absolute inset-0 h-full w-full object-contain" />}
              </Link>


              <div className="flex-1 min-w-0">
                <Link to="/product/$slug" params={{ slug: r.product.slug }} className="font-display text-lg hover:text-primary">{r.product.name}</Link>
                <div className="text-xs text-muted-foreground">{r.product.unit}</div>
                <div className="text-primary font-semibold mt-1">{formatMoney(pickPrice(r.product, country), country)}</div>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => { removeLocalCartItem(r.product.id); toast.success("Removed from cart"); }} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-4 w-4" /></button>
                <div className="flex items-center border border-border rounded-full">
                  <button onClick={() => updateLocalCartItem(r.product.id, Math.max(1, r.quantity - 1))} className="p-2"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center text-sm">{r.quantity}</span>
                  <button onClick={() => updateLocalCartItem(r.product.id, r.quantity + 1)} className="p-2"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-32">
          <h2 className="font-display text-xl mb-4">Order Summary</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(subtotal, country)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping, country)}</dd></div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
              <dt>Total</dt><dd className="text-primary">{formatMoney(total, country)}</dd>
            </div>
          </dl>
          {subtotal < freeOver && (
            <p className="text-xs text-muted-foreground mt-3">Add {formatMoney(freeOver - subtotal, country)} more for free shipping.</p>
          )}
          <Link to="/checkout" className="btn-hero w-full mt-6">
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/shop" className="block text-center text-sm text-muted-foreground mt-3 hover:text-primary">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
