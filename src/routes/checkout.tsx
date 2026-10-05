import { createFileRoute, useNavigate, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { placeOrder, completeOrderMock } from "@/lib/orders.functions";
import { validateCoupon } from "@/lib/coupons.functions";
import { createPaypalOrder } from "@/lib/paypal.functions";
import { getMyProfile } from "@/lib/profile.functions";
import { getPublicSettings } from "@/lib/settings.functions";
import { COUNTRIES, formatMoney, pickPrice, useCountry, getCountryMeta } from "@/lib/country";
import { toast } from "sonner";
import { clearLocalCart, useLocalCart } from "@/lib/local-cart";
import { useAuthReady } from "@/hooks/use-auth-ready";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Takin Mart" }] }),
  component: Checkout,
});

function Checkout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return pathname !== "/checkout" ? <Outlet /> : <CheckoutForm />;
}

function CheckoutForm() {
  const { ready: authReady, user } = useAuthReady();
  const navigate = useNavigate();

  const fetchProfile = useServerFn(getMyProfile);
  const fetchSettings = useServerFn(getPublicSettings);
  const placeFn = useServerFn(placeOrder);
  const completeFn = useServerFn(completeOrderMock);
  const validateCouponFn = useServerFn(validateCoupon);
  const paypalFn = useServerFn(createPaypalOrder);
  const { items, ready } = useLocalCart();
  const [country, setCountry] = useCountry();
  const countryMeta = getCountryMeta(country);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: () => fetchProfile(), enabled: authReady && !!user });
  const { data: settings } = useQuery({ queryKey: ["public-settings"], queryFn: () => fetchSettings() });
  const payments: any = settings?.payments ?? { cod_enabled: true };

  const [form, setForm] = useState({
    full_name: "", phone: "", address_line1: "", address_line2: "",
    city: "", state: "", postal_code: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "manual" | "razorpay" | "whatsapp" | "paypal">("cod");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        full_name: profile.full_name ?? f.full_name,
        phone: profile.phone ?? f.phone,
        address_line1: profile.address_line1 ?? f.address_line1,
        address_line2: profile.address_line2 ?? f.address_line2,
        city: profile.city ?? f.city,
        state: profile.state ?? f.state,
        postal_code: profile.postal_code ?? f.postal_code,
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (paymentMethod === "cod" && payments.cod_enabled === false) {
      if (payments.manual_enabled) setPaymentMethod("manual");
      else if (payments.razorpay_enabled) setPaymentMethod("razorpay");
      else if (payments.whatsapp_enabled) setPaymentMethod("whatsapp");
      else if (payments.paypal_enabled) setPaymentMethod("paypal");
    }
  }, [paymentMethod, payments.cod_enabled, payments.manual_enabled, payments.razorpay_enabled, payments.whatsapp_enabled]);

  const submit = useMutation({
    mutationFn: async () => {
      const res = await placeFn({ data: { ...form, country: countryMeta.name, country_code: country, currency: countryMeta.currency, payment_method: paymentMethod, coupon_code: coupon?.code ?? null, items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })) } });
      if (paymentMethod === "paypal") {
        const origin = window.location.origin;
        const pp = await paypalFn({ data: { orderId: res.orderId, returnUrl: `${origin}/checkout/paypal-return?orderId=${res.orderId}`, cancelUrl: `${origin}/orders/${res.orderId}` } });
        window.location.href = pp.approveUrl;
        return res;
      }
      if (paymentMethod === "razorpay" && payments.razorpay_mode !== "live") {
        await completeFn({ data: { orderId: res.orderId } });
      }
      return res;
    },
    onSuccess: (r) => {
      if (paymentMethod === "paypal") return;
      clearLocalCart();
      if (paymentMethod === "whatsapp") {
        const number = String(payments.whatsapp_number ?? "").replace(/[^0-9]/g, "");
        const lines = items.map((it) => `• ${it.product.name} × ${it.quantity} — ${formatMoney(pickPrice(it.product, country) * it.quantity, country)}`).join("\n");
        const msg = `Hello Takin Mart 👋\n\nI've just placed order #${r.orderId.slice(0, 8)} and would like to pay via WhatsApp.\n\n${lines}\n\nSubtotal: ${formatMoney(subtotal, country)}\nShipping: ${shipping === 0 ? "Free" : formatMoney(shipping, country)}\nTotal: ${formatMoney(total, country)}\n\nName: ${form.full_name}\nPhone: ${form.phone}\nAddress: ${form.address_line1}${form.address_line2 ? ", " + form.address_line2 : ""}, ${form.city} ${form.postal_code}, ${countryMeta.name}\n\nPlease share payment details. Thank you!`;
        if (number) {
          const url = `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
          window.open(url, "_blank", "noopener,noreferrer");
        } else {
          toast.error("WhatsApp number not configured by the store");
        }
        navigate({ to: "/orders/$id", params: { id: r.orderId } });
        return;
      }
      navigate({ to: "/checkout/success", search: { orderId: r.orderId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authReady || !ready) return <div className="container-page py-24 text-center">Loading…</div>;

  if (items.length === 0) {
    return (
      <div className="container-page py-24 text-center">
        <h1 className="font-display text-3xl">Your cart is empty</h1>
        <Link to="/shop" className="btn-hero mt-6">Shop products</Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, r) => s + pickPrice(r.product, country) * r.quantity, 0);
  const shippingConfig: any = settings?.shipping ?? {};
  const freeOver = Number(shippingConfig.free_threshold_inr ?? shippingConfig.free_over ?? 1500);
  const flatRate = Number(shippingConfig.flat_rate_inr ?? shippingConfig.flat_rate ?? 99);
  const shipping = subtotal >= freeOver ? 0 : flatRate;
  const discount = Math.min(coupon?.discount ?? 0, subtotal);
  const total = Math.max(0, subtotal - discount) + shipping;

  const input = "w-full bg-card border border-border rounded-lg px-4 py-3 text-sm outline-none focus:border-primary";

  if (!user) {
    return (
      <div className="container-page py-24 max-w-xl mx-auto text-center">
        <h1 className="font-display text-4xl">Sign in to checkout</h1>
        <p className="text-muted-foreground mt-3">Your cart is saved here. Sign in only when you're ready to place the order.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link to="/auth" search={{ redirect: "/checkout" }} className="btn-hero">Sign in & checkout</Link>
          <Link to="/cart" className="btn-ghost-hero">Back to cart</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl mb-8">Checkout</h1>
      <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-5">
          <h2 className="font-display text-2xl">Shipping Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <input required maxLength={120} placeholder="Full name" className={input} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input required maxLength={30} placeholder="Phone" className={input} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <input required maxLength={200} placeholder="Address line 1" className={input} value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} />
          <input maxLength={200} placeholder="Address line 2 (optional)" className={input} value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} />
          <div className="grid sm:grid-cols-3 gap-4">
            <input required maxLength={100} placeholder="City" className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input maxLength={100} placeholder="State" className={input} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            <input required maxLength={20} placeholder="Postal code" className={input} value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <div className="font-medium mb-2">Ship to & currency</div>
            <div className="grid grid-cols-3 gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setCountry(c.code)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${country === c.code ? "border-primary bg-primary/5" : "border-border hover:border-primary"}`}
                >
                  <span className="text-lg leading-none">{c.flag}</span>
                  <div className="mt-1 text-xs font-semibold">{c.name}</div>
                  <div className="text-[10px] text-muted-foreground">{c.currency} · {c.symbol}</div>
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Prices update in {countryMeta.currency}. Orders record the currency used.</p>
          </div>
          <div className="bg-accent/40 border border-border rounded-xl p-4 text-sm text-muted-foreground">
            🔒 Orders are secured through your selected payment method.
          </div>
          <section className="space-y-3">
            <h2 className="font-display text-2xl">Payment Method</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {payments.cod_enabled !== false && (
                <button type="button" onClick={() => setPaymentMethod("cod")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"}`}>
                  <span className="block font-semibold">Cash on delivery</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Pay when the order arrives.</span>
                </button>
              )}
              {payments.manual_enabled && (
                <button type="button" onClick={() => setPaymentMethod("manual")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "manual" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"}`}>
                  <span className="block font-semibold">{payments.manual_title ?? "Manual payment"}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Transfer and wait for confirmation.</span>
                </button>
              )}
              {payments.razorpay_enabled && (
                <button type="button" onClick={() => setPaymentMethod("razorpay")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "razorpay" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"}`}>
                  <span className="block font-semibold">Razorpay</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Card, UPI, wallet and netbanking.</span>
                </button>
              )}
              {payments.whatsapp_enabled && (
                <button type="button" onClick={() => setPaymentMethod("whatsapp")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "whatsapp" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"}`}>
                  <span className="block font-semibold">💬 {payments.whatsapp_title ?? "Pay via WhatsApp"}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Confirm & pay with our team on WhatsApp.</span>
                </button>
              )}
              {payments.paypal_enabled && (
                <button type="button" onClick={() => setPaymentMethod("paypal")} className={`rounded-xl border p-4 text-left transition ${paymentMethod === "paypal" ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary"}`}>
                  <span className="block font-semibold">🅿️ {payments.paypal_title ?? "PayPal"}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">Pay securely with PayPal or card (USD).</span>
                </button>
              )}
            </div>
            {paymentMethod === "paypal" && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
                You'll be redirected to PayPal to approve the payment{payments.paypal_mode !== "live" ? " (test mode)" : ""}. Your order is charged in USD.
              </div>
            )}
            {paymentMethod === "manual" && payments.manual_instructions && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm whitespace-pre-line text-muted-foreground">{payments.manual_instructions}</div>
            )}
            {paymentMethod === "whatsapp" && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm whitespace-pre-line text-foreground">
                {payments.whatsapp_instructions || "After placing the order, WhatsApp will open with your order details pre-filled so you can confirm payment with our team."}
              </div>
            )}
          </section>
        </div>
        <aside className="bg-card border border-border rounded-2xl p-6 h-fit sticky top-32">
          <h2 className="font-display text-xl mb-4">Order Summary</h2>
          <ul className="space-y-3 mb-4 text-sm border-b border-border pb-4">
            {items.map((r: any) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span className="truncate">{r.product.name} × {r.quantity}</span>
                <span>{formatMoney(pickPrice(r.product, country) * r.quantity, country)}</span>
              </li>
            ))}
          </ul>
          <div className="mb-4">
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                maxLength={40}
                className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={applying || !couponInput.trim()}
                onClick={async () => {
                  setApplying(true);
                  try {
                    const r: any = await validateCouponFn({ data: { code: couponInput.trim(), subtotal } });
                    if (r.ok) { setCoupon({ code: r.code, discount: r.discount }); toast.success(`Coupon ${r.code} applied`); }
                    else { setCoupon(null); toast.error(r.error); }
                  } catch (e: any) { setCoupon(null); toast.error(e?.message ?? "Could not apply coupon"); }
                  finally { setApplying(false); }
                }}
                className="shrink-0 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition disabled:opacity-50"
              >
                {applying ? "…" : "Apply"}
              </button>
            </div>
            {coupon && (
              <button type="button" onClick={() => { setCoupon(null); setCouponInput(""); }} className="mt-2 text-xs text-muted-foreground underline">
                Remove coupon {coupon.code}
              </button>
            )}
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatMoney(subtotal, country)}</dd></div>
            {discount > 0 && (
              <div className="flex justify-between text-primary"><dt>Discount ({coupon?.code})</dt><dd>− {formatMoney(discount, country)}</dd></div>
            )}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping === 0 ? "Free" : formatMoney(shipping, country)}</dd></div>
            <div className="border-t border-border pt-3 flex justify-between font-semibold text-lg">
              <dt>Total</dt><dd className="text-primary">{formatMoney(total, country)}</dd>
            </div>
          </dl>
          <button type="submit" disabled={submit.isPending} className="btn-hero w-full mt-6 disabled:opacity-60">
            {submit.isPending ? "Placing order…" : "Place Order"}
          </button>
        </aside>
      </form>
    </div>
  );
}
