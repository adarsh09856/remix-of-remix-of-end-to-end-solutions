import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  posBootstrap, posCheckout, posCloseSession, posDayStats, posListSales,
  posListSessions, posOpenSession, posRefundSale, posSessionReport,
  posOnlineOrders, posUpdateOrderStatus,
} from "@/lib/pos.functions";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, type CountryCode, COUNTRIES } from "@/lib/country";
import { resolveAsset } from "@/lib/asset-map";
import {
  Search, Plus, Minus, Trash2, X, Printer, RotateCcw, LockKeyhole,
  Barcode, ShoppingCart, Receipt, Wallet, LayoutGrid, Globe, Truck, CheckCircle2, Ban,
} from "lucide-react";


export const Route = createFileRoute("/_authenticated/pos")({
  head: () => ({ meta: [{ title: "POS Register — Takin Mart" }] }),
  component: PosPage,
});

type Line = { productId: string; name: string; unit: number; qty: number; image?: string | null; stock: number; unitLabel?: string };
type PayMethod = "cash" | "card" | "qr" | "mbob" | "bank" | "credit" | "other";
const METHODS: Array<{ id: PayMethod; label: string }> = [
  { id: "cash", label: "Cash" },
  { id: "card", label: "Card" },
  { id: "qr", label: "QR / UPI" },
  { id: "mbob", label: "mBoB" },
  { id: "bank", label: "Bank transfer" },
  { id: "credit", label: "Credit (pay later)" },
  { id: "other", label: "Other" },
];

const r2 = (n: number) => Math.round(n * 100) / 100;

function priceOf(p: any, code: CountryCode) {
  const base = Number(p.price_inr ?? 0);
  if (code === "IN") return p.price_in == null ? base : Number(p.price_in);
  if (code === "US") return p.price_us == null ? r2(base * 0.012) : Number(p.price_us);
  return base;
}

function PosPage() {
  const boot = useServerFn(posBootstrap);
  const qc = useQueryClient();
  const [tab, setTab] = useState<"online" | "register" | "sales" | "sessions">("online");
  const [live, setLive] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["pos", "bootstrap"],
    queryFn: () => boot(),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Live sync: any online order placed or changed refreshes the register, stock and stats automatically.
  useEffect(() => {
    const channel = supabase
      .channel("pos-orders-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        qc.invalidateQueries({ queryKey: ["pos"] });
        if (payload.eventType === "INSERT" && (payload.new as any)?.channel !== "pos") {
          toast.success("New online order received");
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        qc.invalidateQueries({ queryKey: ["pos"] });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="h-6 w-40 animate-pulse rounded-full bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }
  if (isError) {
    return (
      <div className="container-page py-16">
        <h1 className="font-display text-2xl">Register unavailable</h1>
        <p className="mt-2 text-muted-foreground">{(error as Error)?.message === "Forbidden" ? "You need admin access to use the POS." : (error as Error)?.message}</p>
      </div>
    );
  }

  return (
    <div className="container-page py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl">Takin Mart POS</h1>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className={`inline-block h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
            {live ? "Live — online orders sync automatically" : "Connecting live sync…"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([["online", "Online orders", Globe], ["register", "Register", LayoutGrid], ["sales", "Counter sales", Receipt], ["sessions", "Cash drawer", Wallet]] as const).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id as any)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${tab === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-muted"}`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {tab === "online" && <OnlineOrdersTab />}
        {tab === "register" && <Register data={data!} onDone={() => qc.invalidateQueries({ queryKey: ["pos"] })} />}
        {tab === "sales" && <SalesTab />}
        {tab === "sessions" && <SessionsTab session={data!.session} />}
      </div>

    </div>
  );
}

/* -------------------------------- register -------------------------------- */

function Register({ data, onDone }: { data: any; onDone: () => void }) {
  const checkout = useServerFn(posCheckout);
  const openSession = useServerFn(posOpenSession);
  const statsFn = useServerFn(posDayStats);
  const qc = useQueryClient();

  const [country, setCountry] = useState<CountryCode>("BT");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | "all">("all");
  const [lines, setLines] = useState<Line[]>([]);
  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [note, setNote] = useState("");
  const [payments, setPayments] = useState<Array<{ method: PayMethod; amount: number; reference: string }>>([
    { method: "cash", amount: 0, reference: "" },
  ]);
  const [receipt, setReceipt] = useState<any>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: stats } = useQuery({ queryKey: ["pos", "day"], queryFn: () => statsFn(), refetchOnWindowFocus: false });

  const products: any[] = data.products ?? [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      if (cat !== "all" && p.category_id !== cat) return false;
      if (!s) return true;
      return (
        p.name.toLowerCase().includes(s) ||
        (p.sku ?? "").toLowerCase().includes(s) ||
        (p.barcode ?? "").toLowerCase().includes(s)
      );
    });
  }, [products, q, cat]);

  function addProduct(p: any) {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === p.id);
      if (found) {
        return prev.map((l) => (l.productId === p.id ? { ...l, qty: Math.min(999, l.qty + 1) } : l));
      }
      return [...prev, { productId: p.id, name: p.name, unit: priceOf(p, country), qty: 1, image: p.image_url, stock: p.stock, unitLabel: p.unit }];
    });
  }

  // re-price lines when country changes
  useEffect(() => {
    setLines((prev) =>
      prev.map((l) => {
        const p = products.find((x) => x.id === l.productId);
        return p ? { ...l, unit: priceOf(p, country) } : l;
      }),
    );
  }, [country]); // eslint-disable-line react-hooks/exhaustive-deps

  function onScanSubmit(e: React.FormEvent) {
    e.preventDefault();
    const s = q.trim().toLowerCase();
    if (!s) return;
    const hit = products.find((p) => (p.barcode ?? "").toLowerCase() === s || (p.sku ?? "").toLowerCase() === s) ?? filtered[0];
    if (hit) {
      addProduct(hit);
      setQ("");
    } else toast.error("No product matched");
  }

  const subtotal = r2(lines.reduce((s, l) => s + l.unit * l.qty, 0));
  const discount = r2(Math.min(subtotal, discountType === "percent" ? (subtotal * discountValue) / 100 : discountValue));
  const tax = r2(((subtotal - discount) * taxRate) / 100);
  const total = r2(subtotal - discount + tax);
  const tendered = r2(payments.reduce((s, p) => s + (Number(p.amount) || 0), 0));
  const change = r2(Math.max(0, tendered - total));
  const due = r2(Math.max(0, total - tendered));
  const fm = (n: number) => formatMoney(n, country);

  const currency = country === "IN" ? "INR" : country === "US" ? "USD" : "BTN";

  const openMut = useMutation({
    mutationFn: (openingFloat: number) => openSession({ data: { openingFloat } }),
    onSuccess: () => { toast.success("Register opened"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });

  const saleMut = useMutation({
    mutationFn: () =>
      checkout({
        data: {
          sessionId: data.session?.id ?? null,
          countryCode: country,
          currency,
          items: lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unit })),
          discountType,
          discountValue,
          taxRate,
          payments: payments
            .filter((p) => Number(p.amount) > 0 || p.method === "credit")
            .map((p) => ({ method: p.method, amount: Number(p.amount) || 0, reference: p.reference || null })),
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          note: note || null,
        } as any,
      }),
    onSuccess: (res: any) => {
      setReceipt({ ...res, country });
      setLines([]);
      setDiscountValue(0);
      setPayments([{ method: "cash", amount: 0, reference: "" }]);
      setCustomerName(""); setCustomerPhone(""); setNote("");
      qc.invalidateQueries({ queryKey: ["pos"] });
      toast.success("Sale complete");
      searchRef.current?.focus();
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!data.session) {
    return <OpenRegister onOpen={(v) => openMut.mutate(v)} pending={openMut.isPending} />;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* catalog */}
      <div>
        <div className="grid gap-2 sm:grid-cols-4">
          {[
            ["Sales today", String(stats?.sales ?? 0)],
            ["Revenue", fm(stats?.revenue ?? 0)],
            ["Units", String(stats?.units ?? 0)],
            ["Avg ticket", fm(stats?.avg ?? 0)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-card p-3">
              <div className="text-xs text-muted-foreground">{k}</div>
              <div className="font-display text-lg">{v}</div>
            </div>
          ))}
        </div>

        <form onSubmit={onScanSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchRef}
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Scan barcode or search name / SKU…"
              className="w-full rounded-xl border border-border bg-card py-3 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm hover:bg-muted">
            <Barcode className="h-4 w-4" /> Add
          </button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => setCat("all")} className={`rounded-full px-3 py-1 text-xs ${cat === "all" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>All</button>
          {(data.categories ?? []).map((c: any) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-full px-3 py-1 text-xs ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c.name}</button>
          ))}
          <div className="ml-auto flex gap-1">
            {COUNTRIES.map((c) => (
              <button key={c.code} onClick={() => setCountry(c.code)} className={`rounded-full px-3 py-1 text-xs ${country === c.code ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c.flag} {c.currency}</button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addProduct(p)}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary"
            >
              <div className="product-stage aspect-square">
                {p.image_url ? <img src={resolveAsset(p.image_url)} alt={p.name} className="h-full w-full object-contain" loading="lazy" /> : null}
              </div>
              <div className="p-3">
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{fm(priceOf(p, country))}</span>
                  <span className={p.stock > 0 ? "text-muted-foreground" : "text-destructive"}>{p.stock > 0 ? `${p.stock} left` : "Out"}</span>
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">No products match.</p>}
        </div>
      </div>

      {/* ticket */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 font-display text-lg"><ShoppingCart className="h-4 w-4" /> Ticket</h2>
            {lines.length > 0 && (
              <button onClick={() => setLines([])} className="text-xs text-muted-foreground hover:text-destructive">Clear</button>
            )}
          </div>

          <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
            {lines.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Scan or tap a product to start.</p>}
            {lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-2 rounded-xl border border-border p-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">
                    <input
                      type="number" step="0.01" value={l.unit}
                      onChange={(e) => setLines((prev) => prev.map((x) => x.productId === l.productId ? { ...x, unit: Number(e.target.value) || 0 } : x))}
                      className="w-20 rounded border border-border bg-background px-1 py-0.5 text-xs"
                    /> × {l.qty} = <span className="font-medium text-foreground">{fm(l.unit * l.qty)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setLines((prev) => prev.flatMap((x) => x.productId !== l.productId ? [x] : x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []))} className="rounded-md border border-border p-1"><Minus className="h-3 w-3" /></button>
                  <span className="w-6 text-center text-sm">{l.qty}</span>
                  <button onClick={() => setLines((prev) => prev.map((x) => x.productId === l.productId ? { ...x, qty: Math.min(999, x.qty + 1) } : x))} className="rounded-md border border-border p-1"><Plus className="h-3 w-3" /></button>
                  <button onClick={() => setLines((prev) => prev.filter((x) => x.productId !== l.productId))} className="rounded-md border border-border p-1 text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={fm(subtotal)} />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Discount</span>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)} className="rounded border border-border bg-background px-1 py-0.5 text-xs">
                <option value="flat">Amount</option>
                <option value="percent">%</option>
              </select>
              <input type="number" min={0} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value) || 0)} className="w-20 rounded border border-border bg-background px-2 py-0.5 text-xs" />
              <span className="ml-auto">−{fm(discount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Tax %</span>
              <input type="number" min={0} max={100} value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value) || 0)} className="w-20 rounded border border-border bg-background px-2 py-0.5 text-xs" />
              <span className="ml-auto">{fm(tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2 font-display text-xl">
              <span>Total</span><span>{fm(total)}</span>
            </div>
          </div>

          {/* payments */}
          <div className="mt-4 space-y-2">
            {payments.map((p, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <select value={p.method} onChange={(e) => setPayments((prev) => prev.map((x, j) => j === i ? { ...x, method: e.target.value as PayMethod } : x))} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs">
                  {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
                <input type="number" min={0} step="0.01" placeholder="Amount" value={p.amount || ""} onChange={(e) => setPayments((prev) => prev.map((x, j) => j === i ? { ...x, amount: Number(e.target.value) || 0 } : x))} className="w-24 rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                <input placeholder="Ref" value={p.reference} onChange={(e) => setPayments((prev) => prev.map((x, j) => j === i ? { ...x, reference: e.target.value } : x))} className="w-20 flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs" />
                {payments.length > 1 && <button onClick={() => setPayments((prev) => prev.filter((_, j) => j !== i))} className="rounded p-1 text-destructive"><X className="h-3 w-3" /></button>}
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setPayments((prev) => prev.map((x, j) => j === 0 ? { ...x, amount: total } : x))} className="rounded-full bg-muted px-3 py-1 text-xs">Exact {fm(total)}</button>
              {[100, 500, 1000].map((v) => (
                <button key={v} onClick={() => setPayments((prev) => prev.map((x, j) => j === 0 ? { ...x, amount: r2((Number(x.amount) || 0) + v) } : x))} className="rounded-full bg-muted px-3 py-1 text-xs">+{v}</button>
              ))}
              <button onClick={() => setPayments((prev) => [...prev, { method: "card", amount: 0, reference: "" }])} className="rounded-full bg-muted px-3 py-1 text-xs">+ Split</button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{due > 0 ? "Balance due" : "Change"}</span>
              <span className={due > 0 ? "font-semibold text-destructive" : "font-semibold text-primary"}>{due > 0 ? fm(due) : fm(change)}</span>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <input placeholder="Customer name (optional)" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Phone (optional)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>

          <button
            disabled={lines.length === 0 || saleMut.isPending || (due > 0 && !payments.some((p) => p.method === "credit"))}
            onClick={() => saleMut.mutate()}
            className="btn-hero mt-4 w-full disabled:opacity-50"
          >
            {saleMut.isPending ? "Processing…" : `Charge ${fm(total)}`}
          </button>
        </div>
      </aside>

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>
  );
}

function OpenRegister({ onOpen, pending }: { onOpen: (v: number) => void; pending: boolean }) {
  const [float, setFloat] = useState(0);
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
      <LockKeyhole className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-3 font-display text-xl">Open the register</h2>
      <p className="mt-1 text-sm text-muted-foreground">Count the cash in the drawer and enter the opening float to start a shift.</p>
      <input type="number" min={0} value={float} onChange={(e) => setFloat(Number(e.target.value) || 0)} className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-center text-lg" />
      <button disabled={pending} onClick={() => onOpen(float)} className="btn-hero mt-4 w-full disabled:opacity-50">{pending ? "Opening…" : "Open register"}</button>
    </div>
  );
}

/* --------------------------------- receipt -------------------------------- */

function ReceiptModal({ receipt, onClose }: { receipt: any; onClose: () => void }) {
  const o = receipt.order;
  const t = receipt.totals;
  const code: CountryCode = receipt.country ?? "BT";
  const fm = (n: number) => formatMoney(n, code);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-background p-5">
        <div id="pos-receipt" className="text-sm">
          <div className="text-center">
            <div className="font-display text-lg">Takin Mart</div>
            <div className="text-xs text-muted-foreground">Invoice {o.invoice_number}</div>
            <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
          </div>
          <div className="my-3 border-t border-dashed border-border" />
          {(o.order_items ?? []).map((it: any, i: number) => (
            <div key={i} className="flex justify-between py-0.5">
              <span className="pr-2">{it.product_name} × {it.quantity}</span>
              <span>{fm(Number(it.line_total_inr))}</span>
            </div>
          ))}
          <div className="my-3 border-t border-dashed border-border" />
          <Row label="Subtotal" value={fm(t.subtotal)} />
          {t.discount > 0 && <Row label="Discount" value={`−${fm(t.discount)}`} />}
          {t.tax > 0 && <Row label="Tax" value={fm(t.tax)} />}
          <div className="flex justify-between font-semibold"><span>Total</span><span>{fm(t.total)}</span></div>
          <Row label="Tendered" value={fm(t.tendered)} />
          <Row label="Change" value={fm(t.change)} />
          {o.customer_name && <div className="mt-2 text-xs text-muted-foreground">Customer: {o.customer_name} {o.customer_phone ?? ""}</div>}
          <p className="mt-3 text-center text-xs text-muted-foreground">Kadrinchey la — thank you!</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={() => window.print()} className="btn-hero flex-1 inline-flex items-center justify-center gap-2"><Printer className="h-4 w-4" /> Print</button>
          <button onClick={onClose} className="flex-1 rounded-full border border-border px-4 py-2 text-sm">New sale</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- sales --------------------------------- */

function SalesTab() {
  const list = useServerFn(posListSales);
  const refund = useServerFn(posRefundSale);
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["pos", "sales", search],
    queryFn: () => list({ data: { search: search || null } }),
    refetchOnWindowFocus: false,
  });
  const refundMut = useMutation({
    mutationFn: (orderId: string) => refund({ data: { orderId } }),
    onSuccess: () => { toast.success("Refunded and restocked"); qc.invalidateQueries({ queryKey: ["pos"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer or phone…" className="w-full max-w-md rounded-xl border border-border bg-card px-3 py-2 text-sm" />
      <div className="mt-4 space-y-3">
        {isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}
        {(data ?? []).map((o: any) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{o.invoice_number ?? o.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()} · {o.customer_name || "Walk-in"} {o.customer_phone ? `· ${o.customer_phone}` : ""}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{formatMoney(Number(o.total_inr), o.country_code ?? "BT")}</div>
                <div className={`text-xs ${o.status === "cancelled" ? "text-destructive" : "text-muted-foreground"}`}>{o.status === "cancelled" ? "Refunded" : "Paid"}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {(o.order_items ?? []).map((i: any) => `${i.product_name} × ${i.quantity}`).join(", ")}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {(o.pos_payments ?? []).map((p: any) => (
                <span key={p.id} className="rounded-full bg-muted px-2 py-0.5">{p.method}: {formatMoney(Number(p.amount), o.country_code ?? "BT")}</span>
              ))}
              {o.status !== "cancelled" && (
                <button onClick={() => refundMut.mutate(o.id)} className="ml-auto inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-3 w-3" /> Refund
                </button>
              )}
            </div>
          </div>
        ))}
        {!isLoading && (data ?? []).length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No counter sales yet.</p>}
      </div>
    </div>
  );
}

/* -------------------------------- sessions -------------------------------- */

function SessionsTab({ session }: { session: any }) {
  const listFn = useServerFn(posListSessions);
  const reportFn = useServerFn(posSessionReport);
  const closeFn = useServerFn(posCloseSession);
  const qc = useQueryClient();
  const [closingCash, setClosingCash] = useState(0);
  const [note, setNote] = useState("");

  const { data: sessions } = useQuery({ queryKey: ["pos", "sessions"], queryFn: () => listFn(), refetchOnWindowFocus: false });
  const { data: report } = useQuery({
    queryKey: ["pos", "report", session?.id],
    queryFn: () => reportFn({ data: { sessionId: session.id } }),
    enabled: !!session?.id,
    refetchOnWindowFocus: false,
  });

  const closeMut = useMutation({
    mutationFn: () => closeFn({ data: { sessionId: session.id, closingCash, note: note || null } }),
    onSuccess: (r: any) => { toast.success(`Register closed · difference ${r.difference}`); qc.invalidateQueries({ queryKey: ["pos"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg">Current shift</h2>
        {!session && <p className="mt-2 text-sm text-muted-foreground">No open register. Open one from the Register tab.</p>}
        {session && (
          <>
            <p className="mt-1 text-xs text-muted-foreground">Opened {new Date(session.opened_at).toLocaleString()}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Opening float" value={String(session.opening_float)} />
              <Row label="Sales" value={String(report?.saleCount ?? 0)} />
              <Row label="Gross" value={String(report?.gross ?? 0)} />
              <Row label="Refunded" value={String(report?.refunded ?? 0)} />
              {Object.entries(report?.byMethod ?? {}).map(([m, v]) => <Row key={m} label={`By ${m}`} value={String(v)} />)}
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>Expected in drawer</span><span>{report?.expectedCash ?? 0}</span></div>
            </dl>
            <div className="mt-4 space-y-2">
              <label className="block text-xs text-muted-foreground">Counted cash
                <input type="number" min={0} value={closingCash} onChange={(e) => setClosingCash(Number(e.target.value) || 0)} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </label>
              <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              <div className="text-sm text-muted-foreground">Difference: <span className="font-medium text-foreground">{r2(closingCash - Number(report?.expectedCash ?? 0))}</span></div>
              <button onClick={() => closeMut.mutate()} disabled={closeMut.isPending} className="btn-hero w-full disabled:opacity-50">Close register</button>
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-lg">Shift history</h2>
        <div className="mt-3 space-y-2 text-sm">
          {(sessions ?? []).map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border p-3">
              <div className="flex justify-between">
                <span>{new Date(s.opened_at).toLocaleString()}</span>
                <span className={s.status === "open" ? "text-primary" : "text-muted-foreground"}>{s.status}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Float {s.opening_float} · Counted {s.closing_cash ?? "—"} · Expected {s.expected_cash ?? "—"} · Diff {s.difference ?? "—"}
              </div>
              {s.note && <div className="mt-1 text-xs italic text-muted-foreground">{s.note}</div>}
            </div>
          ))}
          {(sessions ?? []).length === 0 && <p className="text-sm text-muted-foreground">No shifts yet.</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ online orders ----------------------------- */

const ONLINE_STATUSES = ["all", "pending", "paid", "fulfilled", "cancelled"] as const;
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  fulfilled: "bg-primary/15 text-primary",
  cancelled: "bg-destructive/15 text-destructive",
};

function OnlineOrdersTab() {
  const listFn = useServerFn(posOnlineOrders);
  const updateFn = useServerFn(posUpdateOrderStatus);
  const statsFn = useServerFn(posDayStats);
  const qc = useQueryClient();
  const [status, setStatus] = useState<(typeof ONLINE_STATUSES)[number]>("all");
  const [search, setSearch] = useState("");

  const { data: stats } = useQuery({ queryKey: ["pos", "day"], queryFn: () => statsFn(), refetchOnWindowFocus: false });
  const { data, isLoading } = useQuery({
    queryKey: ["pos", "online", status, search],
    queryFn: () => listFn({ data: { status, search: search || null } }),
    refetchOnWindowFocus: true,
    refetchInterval: 20000,
  });

  const mut = useMutation({
    mutationFn: (v: { orderId: string; status: string }) => updateFn({ data: v as any }),
    onSuccess: () => { toast.success("Order updated — stock synced"); qc.invalidateQueries({ queryKey: ["pos"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const orders: any[] = data ?? [];

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-4">
        {[
          ["Online orders today", String(stats?.online?.sales ?? 0)],
          ["Online revenue", formatMoney(stats?.online?.revenue ?? 0, "BT")],
          ["Counter sales today", String(stats?.counter?.sales ?? 0)],
          ["Total revenue", formatMoney(stats?.revenue ?? 0, "BT")],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border bg-card p-3">
            <div className="text-xs text-muted-foreground">{k}</div>
            <div className="font-display text-lg">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoice, customer or phone…"
          className="w-full max-w-xs rounded-xl border border-border bg-card px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-1">
          {ONLINE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "bg-muted"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}
        {orders.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{o.invoice_number ?? o.id.slice(0, 8)}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] capitalize ${STATUS_STYLE[o.status] ?? "bg-muted"}`}>{o.status}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] uppercase">{o.payment_method}</span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()} · {o.ship_full_name} {o.ship_phone ? `· ${o.ship_phone}` : ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  {[o.ship_address_line1, o.ship_city, o.ship_state, o.ship_postal_code, o.ship_country].filter(Boolean).join(", ")}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-lg">{formatMoney(Number(o.total_inr), (o.country_code ?? "BT") as CountryCode)}</div>
                {Number(o.discount_amount) > 0 && <div className="text-xs text-muted-foreground">Discount −{formatMoney(Number(o.discount_amount), (o.country_code ?? "BT") as CountryCode)}</div>}
              </div>
            </div>

            <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              {(o.order_items ?? []).map((it: any) => (
                <div key={it.id} className="flex justify-between gap-2">
                  <span className="truncate text-muted-foreground">{it.product_name} × {it.quantity}</span>
                  <span>{formatMoney(Number(it.line_total_inr), (o.country_code ?? "BT") as CountryCode)}</span>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {o.status === "pending" && (
                <button disabled={mut.isPending} onClick={() => mut.mutate({ orderId: o.id, status: "paid" })} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50">
                  <CheckCircle2 className="h-3 w-3" /> Mark paid
                </button>
              )}
              {o.status === "paid" && (
                <button disabled={mut.isPending} onClick={() => mut.mutate({ orderId: o.id, status: "fulfilled" })} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground disabled:opacity-50">
                  <Truck className="h-3 w-3" /> Mark fulfilled
                </button>
              )}
              {o.status !== "cancelled" && (
                <button disabled={mut.isPending} onClick={() => mut.mutate({ orderId: o.id, status: "cancelled" })} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50">
                  <Ban className="h-3 w-3" /> Cancel & restock
                </button>
              )}
            </div>
          </div>
        ))}
        {!isLoading && orders.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No online orders yet.</p>}
      </div>
    </div>
  );
}
