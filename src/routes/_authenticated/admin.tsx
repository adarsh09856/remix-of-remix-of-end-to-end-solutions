import { createFileRoute, Link } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  adminListOrders, adminListProducts, adminUpsertProduct, adminDeleteProduct,
  adminUpdateOrderStatus, adminUpdateOrderTracking,
  adminListCategories, adminUpsertCategory, adminDeleteCategory, adminStats,
  adminListCustomers, adminSetCustomerAdmin,
} from "@/lib/admin.functions";
import {
  adminListCoupons, adminUpsertCoupon, adminDeleteCoupon,
  adminListReviews, adminSetReviewStatus, adminDeleteReview,
  adminListInventoryMovements, adminAdjustStock,
  adminCancelOrder, adminMarkOrderRefunded, adminResendOrderEmail,
} from "@/lib/admin-extras.functions";
import { getAdminSettings, updateAdminSettings, sendTestEmail } from "@/lib/settings.functions";
import { isAdmin } from "@/lib/profile.functions";
import { formatINR } from "@/lib/format";
import { formatByCurrency } from "@/lib/country";
import { resolveAsset } from "@/lib/asset-map";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Package, ShoppingBag, Users, Coins, AlertTriangle, Truck, Check, Tag, Star, Boxes, Settings as SettingsIcon, Mail, Image as ImageIcon, CreditCard, ReceiptText, RotateCcw, Send } from "lucide-react";
import { AdminShell, StatTile, type AdminTab } from "@/components/admin/AdminShell";
import { LeadsTab, EnquiriesTab, TasksTab, ActivityTab } from "@/components/admin/CrmTabs";
import { crmPipelineStats } from "@/lib/crm.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Admin — Takin Mart" }] }),
  component: AdminPage,
});

function AdminPage() {
  const fetchAdmin = useServerFn(isAdmin);
  const qc = useQueryClient();
  const { data: admin, isLoading, isError, error } = useQuery({
    queryKey: ["admin"],
    queryFn: () => fetchAdmin(),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const [tab, setTab] = useState<AdminTab>("overview");
  const [demoAdmin, setDemoAdmin] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("takinmart_admin_session") === "true";
    }
    return false;
  });

  const enterConsole = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("takinmart_admin_session", "true");
    }
    setDemoAdmin(true);
  };

  if (isLoading) {
    return (
      <div className="container-page py-16">
        <div className="h-4 w-28 rounded-full bg-muted" />
        <div className="mt-5 h-12 max-w-sm rounded-2xl bg-muted" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-32 rounded-2xl border border-border bg-card" />
          ))}
        </div>
      </div>
    );
  }

  if (isError && !demoAdmin) {
    return (
      <div className="container-page py-24 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-gold mx-auto mb-4" />
        <h1 className="font-display text-3xl">Admin Console</h1>
        <p className="text-muted-foreground mt-3">
          Manage products, orders, coupons, inventory, and store operations.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button onClick={enterConsole} className="btn-hero">Enter Console</button>
          <Link to="/auth" search={{ redirect: "/admin" }} className="btn-ghost-hero">Sign in with Account</Link>
        </div>
      </div>
    );
  }

  if (!admin && !demoAdmin) {
    return (
      <div className="container-page py-24 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-gold mx-auto mb-4" />
        <h1 className="font-display text-3xl">Admin Console Access</h1>
        <p className="text-muted-foreground mt-3">
          Click below to enter the store admin console directly to manage products, categories, orders, and settings.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
          <button onClick={enterConsole} className="btn-hero">Enter Console</button>
          <Link to="/auth" search={{ redirect: "/admin" }} className="btn-ghost-hero">Sign in as Admin</Link>
        </div>
      </div>
    );
  }

  return <AdminConsole tab={tab} setTab={setTab} />;
}

const TAB_META: Record<AdminTab, { title: string; subtitle: string }> = {
  overview: { title: "Dashboard", subtitle: "Store performance, pipeline and activity at a glance" },
  leads: { title: "Leads", subtitle: "Track prospects and wholesale deals through your pipeline" },
  enquiries: { title: "Enquiries", subtitle: "Messages from the Contact page" },
  tasks: { title: "Tasks", subtitle: "Your team's to-dos and follow-ups" },
  activity: { title: "Activity log", subtitle: "Everything that changed recently" },
  products: { title: "Products", subtitle: "Create, edit and price your catalog" },
  categories: { title: "Categories", subtitle: "Organise how products are grouped" },
  inventory: { title: "Inventory", subtitle: "Stock levels and adjustments" },
  orders: { title: "Orders", subtitle: "Fulfil, track, cancel and refund orders" },
  customers: { title: "Customers", subtitle: "Shoppers and admin access" },
  coupons: { title: "Coupons", subtitle: "Discount codes and limits" },
  reviews: { title: "Reviews", subtitle: "Moderate product reviews" },
  settings: { title: "Settings", subtitle: "Store, email, shipping and payments" },
};

function AdminConsole({ tab, setTab }: { tab: AdminTab; setTab: (t: AdminTab) => void }) {
  const statsFn = useServerFn(crmPipelineStats);
  const { data: crm } = useQuery({ queryKey: ["crm-stats"], queryFn: () => statsFn(), staleTime: 30_000 });
  const counts = { leads: crm?.leadNew, enquiries: crm?.enquiryOpen, tasks: crm?.taskOpen };
  const meta = TAB_META[tab];
  return (
    <AdminShell tab={tab} onTab={setTab} counts={counts} title={meta.title} subtitle={meta.subtitle}>
      {tab === "overview" && <OverviewTab onTab={setTab} />}
      {tab === "leads" && <LeadsTab />}
      {tab === "enquiries" && <EnquiriesTab />}
      {tab === "tasks" && <TasksTab />}
      {tab === "activity" && <ActivityTab />}
      {tab === "products" && <ProductsTab />}
      {tab === "categories" && <CategoriesTab />}
      {tab === "orders" && <OrdersTab />}
      {tab === "customers" && <CustomersTab />}
      {tab === "coupons" && <CouponsTab />}
      {tab === "reviews" && <ReviewsTab />}
      {tab === "inventory" && <InventoryTab />}
      {tab === "settings" && <SettingsTab />}
    </AdminShell>
  );
}

function OverviewTab({ onTab }: { onTab: (t: AdminTab) => void }) {
  const fetchFn = useServerFn(adminStats);
  const crmFn = useServerFn(crmPipelineStats);
  const { data } = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchFn() });
  const { data: crm } = useQuery({ queryKey: ["crm-stats"], queryFn: () => crmFn() });
  const s = data ?? { revenue: 0, orderCount: 0, pendingCount: 0, productCount: 0, lowStock: 0, userCount: 0 };
  const c = crm ?? { leadTotal: 0, leadNew: 0, leadWon: 0, pipelineValue: 0, enquiryOpen: 0, enquiryTotal: 0, taskOpen: 0, taskOverdue: 0 };
  const quick: { label: string; tab: AdminTab; icon: any }[] = [
    { label: "Add product", tab: "products", icon: Plus },
    { label: "Manage orders", tab: "orders", icon: ShoppingBag },
    { label: "Create coupon", tab: "coupons", icon: Tag },
    { label: "Adjust stock", tab: "inventory", icon: Boxes },
    { label: "New lead", tab: "leads", icon: Users },
    { label: "Payments setup", tab: "settings", icon: CreditCard },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Revenue" value={formatINR(s.revenue)} hint={`${s.orderCount} orders`} icon={Coins} tone="primary" />
        <StatTile label="Pending orders" value={s.pendingCount} hint="Awaiting action" icon={Truck} tone="gold" />
        <StatTile label="Low stock" value={s.lowStock} hint={`${s.productCount} products`} icon={AlertTriangle} tone={s.lowStock ? "danger" : "muted"} />
        <StatTile label="Customers" value={s.userCount} icon={Users} tone="accent" />
        <StatTile label="Pipeline value" value={formatINR(c.pipelineValue)} hint={`${c.leadTotal} leads · ${c.leadWon} won`} icon={Coins} tone="muted" />
        <StatTile label="New leads" value={c.leadNew} icon={Users} tone="muted" />
        <StatTile label="Open enquiries" value={c.enquiryOpen} hint={`${c.enquiryTotal} total`} icon={Mail} tone="muted" />
        <StatTile label="Open tasks" value={c.taskOpen} hint={c.taskOverdue ? `${c.taskOverdue} overdue` : "On track"} icon={Check} tone={c.taskOverdue ? "danger" : "muted"} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <h3 className="font-display text-lg mb-3">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quick.map((q) => (
              <button key={q.label} onClick={() => onTab(q.tab)} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left text-sm font-medium transition hover:border-primary hover:shadow-soft">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary"><q.icon className="h-4 w-4 text-primary" /></span>
                {q.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg mb-3">Recent activity</h3>
          <ActivityTab compact />
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const fetchFn = useServerFn(adminListProducts);
  const fetchCats = useServerFn(adminListCategories);
  const upsertFn = useServerFn(adminUpsertProduct);
  const deleteFn = useServerFn(adminDeleteProduct);
  const qc = useQueryClient();
  const { data: products, isLoading: productsLoading } = useQuery({ queryKey: ["admin-products"], queryFn: () => fetchFn() });
  const { data: categories, isLoading: categoriesLoading } = useQuery({ queryKey: ["admin-categories"], queryFn: () => fetchCats() });
  const [editing, setEditing] = useState<any | null>(null);

  const upsert = useMutation({
    mutationFn: (p: any) => upsertFn({ data: p }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <button disabled={categoriesLoading} onClick={() => setEditing({ name: "", slug: "", price_inr: 0, price_in: null, price_us: null, compare_at_inr: null, compare_at_in: null, compare_at_us: null, unit: "1kg", stock: 100, low_stock_threshold: 5, is_active: true, active: true, featured: false, gallery: [], images: [], category_id: categories?.[0]?.id ?? null })} className="btn-hero mb-6 disabled:opacity-50">
        <Plus className="h-4 w-4" /> New product
      </button>
      {productsLoading ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">Loading products…</div>
      ) : (
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-secondary text-xs uppercase tracking-wider">
            <tr><th className="text-left p-4">Product</th><th className="text-left p-4">Category</th><th className="text-left p-4">Price</th><th className="text-left p-4">Stock</th><th className="text-left p-4">Status</th><th></th></tr>
          </thead>
          <tbody>
            {(products ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-secondary shrink-0">
                      {p.image_url ? <img src={resolveAsset(p.image_url)} alt={p.name} className="absolute inset-0 h-full w-full object-contain" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-4 w-4" /></div>}
                    </div>

                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground font-mono">/{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-muted-foreground">{p.categories?.name ?? "—"}</td>
                <td className="p-4">
                  <div className="text-sm">🇧🇹 {formatINR(p.price_inr)}</div>
                  <div className="text-xs text-muted-foreground">🇮🇳 {p.price_in == null ? "—" : `₹ ${p.price_in}`} · 🇺🇸 {p.price_us == null ? "—" : `$${p.price_us}`}</div>
                </td>
                <td className="p-4">
                  <span className={p.stock <= 0 ? "text-destructive font-semibold" : p.stock <= (p.low_stock_threshold ?? 5) ? "text-gold-foreground font-semibold" : "text-primary font-semibold"}>
                    {p.stock <= 0 ? "Out of stock" : p.stock <= (p.low_stock_threshold ?? 5) ? `Low · ${p.stock}` : `In stock · ${p.stock}`}
                  </span>
                </td>
                <td className="p-4">{p.is_active ? "Active" : "Hidden"}</td>
                <td className="p-4 text-right space-x-2 whitespace-nowrap">
                  <button onClick={() => setEditing(p)} className="text-primary" aria-label="Edit"><Pencil className="h-4 w-4 inline" /></button>
                  <button onClick={() => { if (confirm("Delete this product?")) del.mutate(p.id); }} className="text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
      {editing && <ProductEditor product={editing} categories={categories ?? []} onSave={(p: any) => upsert.mutate(p)} onClose={() => setEditing(null)} saving={upsert.isPending} />}
    </div>
  );
}

function ProductEditor({ product, categories, onSave, onClose, saving }: any) {
  const [f, setF] = useState(product);
  const [uploading, setUploading] = useState(false);
  const input = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm";
  const gallery = Array.isArray(f.gallery) ? f.gallery : [];

  async function uploadImages(files: FileList | null, mode: "main" | "gallery") {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed");
        if (file.size > 5 * 1024 * 1024) throw new Error("Each image must be under 5MB");
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from("products").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        uploaded.push(`storage://products/${path}`);
      }
      if (mode === "main") setF((prev: any) => ({ ...prev, image_url: uploaded[0], gallery: Array.from(new Set([uploaded[0], ...(Array.isArray(prev.gallery) ? prev.gallery : [])])) }));
      else setF((prev: any) => ({ ...prev, gallery: Array.from(new Set([...(Array.isArray(prev.gallery) ? prev.gallery : []), ...uploaded])) }));
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function saveProduct() {
    onSave({ ...f, images: gallery, active: f.is_active });
  }

  return (
    <div className="fixed inset-0 bg-foreground/40 z-50 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl max-w-3xl w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-2xl mb-4">{f.id ? "Edit" : "New"} product</h3>
        <div className="grid lg:grid-cols-[220px_1fr] gap-5">
          <div className="space-y-3">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
              {f.image_url ? <img src={resolveAsset(f.image_url)} alt={f.name || "Product image"} className="absolute inset-0 h-full w-full object-contain" /> : <div className="grid h-full w-full place-items-center text-muted-foreground"><ImageIcon className="h-8 w-8" /></div>}
            </div>

            <label className="btn-ghost-hero w-full cursor-pointer justify-center text-center">
              {uploading ? "Uploading…" : "Upload main image"}
              <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={(e) => uploadImages(e.target.files, "main")} />
            </label>
            <label className="btn-ghost-hero w-full cursor-pointer justify-center text-center">
              Add gallery images
              <input type="file" accept="image/*" multiple className="sr-only" disabled={uploading} onChange={(e) => uploadImages(e.target.files, "gallery")} />
            </label>
          </div>
          <div className="space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">Product name<input className={`${input} mt-1`} placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="block text-xs font-medium text-muted-foreground">Slug<input className={`${input} mt-1`} placeholder="slug-lowercase-no-spaces" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-background p-2">
            <button type="button" onClick={() => setF({ ...f, category_id: null })} className={`rounded-lg px-3 py-2 text-xs font-medium ${!f.category_id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>No category</button>
            {categories.map((c: any) => (
              <button key={c.id} type="button" onClick={() => setF({ ...f, category_id: c.id })} className={`rounded-lg px-3 py-2 text-xs font-medium ${f.category_id === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
                {c.name}
              </button>
            ))}
          </div>
          <label className="block text-xs font-medium text-muted-foreground">Tagline<input className={`${input} mt-1`} placeholder="Tagline" value={f.tagline ?? ""} onChange={(e) => setF({ ...f, tagline: e.target.value })} /></label>
          <label className="block text-xs font-medium text-muted-foreground">Description<textarea rows={4} className={`${input} mt-1`} placeholder="Description" value={f.description ?? ""} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-xs font-medium text-muted-foreground">Price<input type="number" className={`${input} mt-1`} placeholder="Price" value={f.price_inr} onChange={(e) => setF({ ...f, price_inr: Number(e.target.value) })} /></label>
            <label className="block text-xs font-medium text-muted-foreground">Unit<input className={`${input} mt-1`} placeholder="Unit" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></label>
            <label className="block text-xs font-medium text-muted-foreground">Stock<input type="number" className={`${input} mt-1`} placeholder="Stock" value={f.stock} onChange={(e) => setF({ ...f, stock: Number(e.target.value) })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-medium text-muted-foreground">SKU (POS lookup)<input className={`${input} mt-1`} placeholder="e.g. HNY-500" value={f.sku ?? ""} onChange={(e) => setF({ ...f, sku: e.target.value || null })} /></label>
            <label className="block text-xs font-medium text-muted-foreground">Barcode (scanner)<input className={`${input} mt-1`} placeholder="EAN / UPC" value={f.barcode ?? ""} onChange={(e) => setF({ ...f, barcode: e.target.value || null })} /></label>
          </div>
          <div className="grid grid-cols-2 gap-2">

            <label className="block text-xs font-medium text-muted-foreground">🇮🇳 India price (INR)<input type="number" step="0.01" className={`${input} mt-1`} placeholder="Leave blank to use Bhutan price" value={f.price_in ?? ""} onChange={(e) => setF({ ...f, price_in: e.target.value === "" ? null : Number(e.target.value) })} /></label>
            <label className="block text-xs font-medium text-muted-foreground">🇺🇸 USA price (USD)<input type="number" step="0.01" className={`${input} mt-1`} placeholder="Leave blank to use Bhutan price" value={f.price_us ?? ""} onChange={(e) => setF({ ...f, price_us: e.target.value === "" ? null : Number(e.target.value) })} /></label>
          </div>
          <div className="rounded-xl border border-border bg-secondary/40 p-3 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sale / offer pricing (MRP shown struck-through)</div>
            <div className="grid grid-cols-3 gap-2">
              <label className="block text-xs font-medium text-muted-foreground">🇧🇹 MRP (BTN)<input type="number" step="0.01" className={`${input} mt-1`} placeholder="No offer" value={f.compare_at_inr ?? ""} onChange={(e) => setF({ ...f, compare_at_inr: e.target.value === "" ? null : Number(e.target.value) })} /></label>
              <label className="block text-xs font-medium text-muted-foreground">🇮🇳 MRP (INR)<input type="number" step="0.01" className={`${input} mt-1`} placeholder="No offer" value={f.compare_at_in ?? ""} onChange={(e) => setF({ ...f, compare_at_in: e.target.value === "" ? null : Number(e.target.value) })} /></label>
              <label className="block text-xs font-medium text-muted-foreground">🇺🇸 MRP (USD)<input type="number" step="0.01" className={`${input} mt-1`} placeholder="No offer" value={f.compare_at_us ?? ""} onChange={(e) => setF({ ...f, compare_at_us: e.target.value === "" ? null : Number(e.target.value) })} /></label>
            </div>
            <p className="text-[11px] text-muted-foreground">Set an MRP higher than the selling price to show a “% off” badge on the storefront.</p>
          </div>
          <label className="block text-xs font-medium text-muted-foreground">Low stock alert threshold<input type="number" className={`${input} mt-1`} placeholder="Low stock alert threshold" value={f.low_stock_threshold ?? 5} onChange={(e) => setF({ ...f, low_stock_threshold: Number(e.target.value) })} /></label>
          <label className="block text-xs font-medium text-muted-foreground">Main image URL / storage path<input className={`${input} mt-1`} placeholder="Image URL or asset key" value={f.image_url ?? ""} onChange={(e) => setF({ ...f, image_url: e.target.value })} /></label>
          <label className="block text-xs font-medium text-muted-foreground">Origin<input className={`${input} mt-1`} placeholder="Origin (farm / region)" value={f.origin ?? "Bhutan"} onChange={(e) => setF({ ...f, origin: e.target.value })} /></label>
          <label className="block text-xs font-medium text-muted-foreground">Gallery images<textarea rows={2} className={`${input} mt-1`} placeholder="Gallery images, one URL or asset key per line" value={(Array.isArray(f.gallery) ? f.gallery : []).join("\n")} onChange={(e) => setF({ ...f, gallery: e.target.value.split("\n").map((v) => v.trim()).filter(Boolean) })} /></label>
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {gallery.map((image: string) => (
                <button key={image} type="button" onClick={() => setF({ ...f, image_url: image })} className={`relative aspect-square overflow-hidden rounded-lg border bg-secondary ${f.image_url === image ? "border-primary" : "border-border"}`}>
                  <img src={resolveAsset(image)} alt="Gallery item" className="absolute inset-0 h-full w-full object-contain" />
                </button>

              ))}
            </div>
          )}
          <label className="block text-xs font-medium text-muted-foreground">Badge<input className={`${input} mt-1`} placeholder="Badge (Bestseller, New)" value={f.badge ?? ""} onChange={(e) => setF({ ...f, badge: e.target.value })} /></label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setF({ ...f, is_active: !f.is_active })} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${f.is_active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
              {f.is_active && <Check className="h-4 w-4" />} Active product
            </button>
            <button type="button" onClick={() => setF({ ...f, featured: !f.featured })} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${f.featured ? "border-gold bg-gold text-gold-foreground" : "border-border text-muted-foreground"}`}>
              {f.featured && <Check className="h-4 w-4" />} Featured
            </button>
          </div>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button disabled={saving || uploading} onClick={saveProduct} className="btn-hero flex-1 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
          <button onClick={onClose} className="btn-ghost-hero flex-1">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const fetchFn = useServerFn(adminListCategories);
  const upsertFn = useServerFn(adminUpsertCategory);
  const deleteFn = useServerFn(adminDeleteCategory);
  const qc = useQueryClient();
  const { data: cats } = useQuery({ queryKey: ["admin-categories"], queryFn: () => fetchFn() });
  const [editing, setEditing] = useState<any | null>(null);

  const upsert = useMutation({
    mutationFn: (c: any) => upsertFn({ data: c }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-categories"] }); toast.success("Deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const input = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm";

  return (
    <div>
      <button onClick={() => setEditing({ name: "", slug: "", sort_order: 0 })} className="btn-hero mb-6">
        <Plus className="h-4 w-4" /> New category
      </button>
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-secondary text-xs uppercase tracking-wider">
            <tr><th className="text-left p-4">Name</th><th className="text-left p-4">Slug</th><th className="text-left p-4">Order</th><th></th></tr>
          </thead>
          <tbody>
            {(cats ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-muted-foreground font-mono text-xs">{c.slug}</td>
                <td className="p-4">{c.sort_order}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => setEditing(c)} className="text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button onClick={() => { if (confirm("Delete category? Products will be uncategorised.")) del.mutate(c.id); }} className="text-destructive"><Trash2 className="h-4 w-4 inline" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-foreground/40 z-50 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit" : "New"} category</h3>
            <div className="space-y-3">
              <input className={input} placeholder="Name" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <input className={input} placeholder="slug-lowercase" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase() })} />
              <textarea rows={3} className={input} placeholder="Description" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <input className={input} placeholder="Image URL or asset key" value={editing.image_url ?? ""} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} />
              <input type="number" className={input} placeholder="Sort order" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => upsert.mutate(editing)} className="btn-hero flex-1">Save</button>
              <button onClick={() => setEditing(null)} className="btn-ghost-hero flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersTab() {
  const fetchFn = useServerFn(adminListCustomers);
  const setAdminFn = useServerFn(adminSetCustomerAdmin);
  const qc = useQueryClient();
  const { data: customers } = useQuery({ queryKey: ["admin-customers"], queryFn: () => fetchFn() });
  const roleMut = useMutation({
    mutationFn: (v: { userId: string; makeAdmin: boolean }) => setAdminFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-customers"] }); toast.success("Customer role updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-x-auto">
      <table className="w-full text-sm min-w-[720px]">
        <thead className="bg-secondary text-xs uppercase tracking-wider">
          <tr><th className="text-left p-4">Customer</th><th className="text-left p-4">Contact</th><th className="text-left p-4">Location</th><th className="text-left p-4">Roles</th><th></th></tr>
        </thead>
        <tbody>
          {(customers ?? []).map((c: any) => {
            const isAdminRole = c.roles?.includes("admin");
            return (
              <tr key={c.id} className="border-t border-border">
                <td className="p-4 font-medium">{c.full_name ?? "Customer"}<div className="text-xs text-muted-foreground font-mono">{c.id.slice(0, 8)}</div></td>
                <td className="p-4 text-muted-foreground">{c.email || "—"}<div>{c.phone || ""}</div></td>
                <td className="p-4 text-muted-foreground">{[c.city, c.country].filter(Boolean).join(", ") || "—"}</td>
                <td className="p-4">{(c.roles ?? []).join(", ") || "user"}</td>
                <td className="p-4 text-right">
                  <button onClick={() => roleMut.mutate({ userId: c.id, makeAdmin: !isAdminRole })} className="text-primary text-xs font-semibold hover:underline">
                    {isAdminRole ? "Remove admin" : "Make admin"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OrdersTab() {
  const fetchFn = useServerFn(adminListOrders);
  const updateStatus = useServerFn(adminUpdateOrderStatus);
  const updateTracking = useServerFn(adminUpdateOrderTracking);
  const cancelOrder = useServerFn(adminCancelOrder);
  const refundOrder = useServerFn(adminMarkOrderRefunded);
  const resendEmail = useServerFn(adminResendOrderEmail);
  const qc = useQueryClient();
  const { data: orders, isLoading } = useQuery({ queryKey: ["admin-orders"], queryFn: () => fetchFn() });
  const [filter, setFilter] = useState<string>("all");

  const upd = useMutation({
    mutationFn: (v: { id: string; status: any }) => updateStatus({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("Status updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const track = useMutation({
    mutationFn: (v: any) => updateTracking({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Tracking saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: (v: { id: string; reason: string }) => cancelOrder({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("Order cancelled"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const refund = useMutation({
    mutationFn: (id: string) => refundOrder({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); toast.success("Refund marked"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const resend = useMutation({
    mutationFn: (id: string) => resendEmail({ data: { id } }),
    onSuccess: (r: any) => r?.ok === false ? toast.error(r.error ?? "Email failed") : toast.success("Email sent"),
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (orders ?? []).filter((o: any) => filter === "all" || o.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "paid", "fulfilled", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider border ${filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{s}</button>
        ))}
      </div>
      {isLoading ? <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">Loading orders…</div> : filtered.map((o: any) => <AdminOrderCard key={o.id} order={o} onStatus={(s: any) => upd.mutate({ id: o.id, status: s })} onTrack={(v: any) => track.mutate({ id: o.id, ...v })} onCancel={(reason: string) => cancel.mutate({ id: o.id, reason })} onRefund={() => refund.mutate(o.id)} onResend={() => resend.mutate(o.id)} />)}
      {!isLoading && filtered.length === 0 && <p className="text-muted-foreground text-center py-12">No orders.</p>}
    </div>
  );
}

function AdminOrderCard({ order: o, onStatus, onTrack, onCancel, onRefund, onResend }: any) {
  const [open, setOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState(o.cancelled_reason ?? "Customer/admin requested cancellation");
  const [t, setT] = useState({
    courier: o.courier ?? "",
    tracking_number: o.tracking_number ?? "",
    estimated_delivery: o.estimated_delivery ?? "",
    admin_notes: o.admin_notes ?? "",
  });
  const input = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm";

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex flex-wrap justify-between items-start gap-3 mb-2">
        <div>
          <div className="font-mono text-xs text-muted-foreground">{o.invoice_number ?? `#${o.id.slice(0, 8)}`} · {o.id}</div>
          <div className="font-medium">{o.ship_full_name} — {o.customer_email || "No email"}</div>
          <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()} · 📞 {o.ship_phone || o.customer_profile?.phone || "—"}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-primary text-lg">{formatByCurrency(o.total_inr, o.currency)}</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{o.payment_method ?? "cod"} · {o.currency ?? "BTN"}</div>
          <div className="mt-2 flex flex-wrap justify-end gap-1">
            {["pending", "paid", "fulfilled", "cancelled"].map((s) => (
              <button key={s} type="button" onClick={() => onStatus(s)} className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${o.status === s ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-3 border-t border-border pt-4 mt-4 text-xs">
        <div className="rounded-xl bg-background border border-border p-3"><span className="block text-muted-foreground uppercase tracking-wider">Subtotal</span><strong>{formatByCurrency(o.subtotal_inr, o.currency)}</strong></div>
        <div className="rounded-xl bg-background border border-border p-3"><span className="block text-muted-foreground uppercase tracking-wider">Shipping</span><strong>{Number(o.shipping_inr) ? formatByCurrency(o.shipping_inr, o.currency) : "Free"}</strong></div>
        <div className="rounded-xl bg-background border border-border p-3"><span className="block text-muted-foreground uppercase tracking-wider">Discount</span><strong>{Number(o.discount_amount) ? formatByCurrency(o.discount_amount, o.currency) : "—"}</strong></div>
      </div>
      <ul className="text-sm border-t border-border pt-3 mt-4 space-y-2">
        {o.order_items.map((it: any) => (
          <li key={it.id} className="flex items-center justify-between gap-3">
            <span className="min-w-0">{it.product_name} × {it.quantity}<span className="text-muted-foreground"> · {formatByCurrency(it.unit_price_inr, o.currency)} each</span></span>
            <span className="font-medium">{formatByCurrency(it.line_total_inr, o.currency)}</span>
          </li>
        ))}
      </ul>
      <div className="grid md:grid-cols-2 gap-3 mt-4 text-xs text-muted-foreground">
        <div className="rounded-xl bg-background border border-border p-3">
          <span className="block text-foreground font-medium mb-1">Shipping address</span>
          {o.ship_address_line1}{o.ship_address_line2 ? `, ${o.ship_address_line2}` : ""}<br />
          {o.ship_city}{o.ship_state ? `, ${o.ship_state}` : ""} {o.ship_postal_code}<br />{o.ship_country}
        </div>
        <div className="rounded-xl bg-background border border-border p-3">
          <span className="block text-foreground font-medium mb-1">Payment</span>
          Method: {(o.payment_method ?? "cod").toUpperCase()}<br />
          Coupon: {o.coupon_code || "—"}<br />
          Razorpay: {o.razorpay_payment_id || o.razorpay_order_id || "—"}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button onClick={() => setOpen((v) => !v)} className="btn-ghost-hero text-xs">{open ? "Hide" : "Manage"} details</button>
        <button onClick={onResend} className="btn-ghost-hero text-xs"><Send className="h-3.5 w-3.5" /> Resend email</button>
        <button onClick={onRefund} className="btn-ghost-hero text-xs"><RotateCcw className="h-3.5 w-3.5" /> Mark refunded</button>
      </div>
      {open && (
        <div className="mt-3 grid sm:grid-cols-2 gap-3 border-t border-border pt-4">
          <input className={input} placeholder="Courier (BlueDart, DTDC…)" value={t.courier} onChange={(e) => setT({ ...t, courier: e.target.value })} />
          <input className={input} placeholder="Tracking number" value={t.tracking_number} onChange={(e) => setT({ ...t, tracking_number: e.target.value })} />
          <input type="date" className={input} value={t.estimated_delivery ?? ""} onChange={(e) => setT({ ...t, estimated_delivery: e.target.value })} />
          <input className={input} placeholder="Internal note" value={t.admin_notes} onChange={(e) => setT({ ...t, admin_notes: e.target.value })} />
          <input className={input} placeholder="Cancellation reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <button onClick={() => onTrack(t)} className="btn-hero">Save tracking</button>
          <button onClick={() => onCancel(cancelReason)} className="btn-ghost-hero text-destructive">Cancel order</button>
        </div>
      )}
    </div>
  );
}

// ---------- Coupons ----------
function CouponsTab() {
  const listFn = useServerFn(adminListCoupons);
  const upsertFn = useServerFn(adminUpsertCoupon);
  const delFn = useServerFn(adminDeleteCoupon);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-coupons"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<any | null>(null);
  const upsert = useMutation({
    mutationFn: (c: any) => upsertFn({ data: c }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); setEditing(null); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-coupons"] }); toast.success("Deleted"); },
  });
  const input = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm";
  return (
    <div>
      <button onClick={() => setEditing({ code: "", type: "percent", value: 10, min_order: 0, per_user_limit: 1, active: true })} className="btn-hero mb-6"><Plus className="h-4 w-4" /> New coupon</button>
      <div className="bg-card border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-secondary text-xs uppercase tracking-wider">
            <tr><th className="text-left p-4">Code</th><th className="text-left p-4">Type</th><th className="text-left p-4">Value</th><th className="text-left p-4">Min order</th><th className="text-left p-4">Used</th><th className="text-left p-4">Status</th><th></th></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Loading coupons…</td></tr>}
            {!isLoading && (data ?? []).map((c: any) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-4 font-mono font-semibold">{c.code}</td>
                <td className="p-4 capitalize">{c.type}</td>
                <td className="p-4">{c.type === "percent" ? `${c.value}%` : formatINR(c.value)}</td>
                <td className="p-4">{formatINR(c.min_order)}</td>
                <td className="p-4">{c.used_count ?? 0}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                <td className="p-4">{c.active ? <span className="text-primary">Active</span> : <span className="text-muted-foreground">Off</span>}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => setEditing(c)} className="text-primary"><Pencil className="h-4 w-4 inline" /></button>
                  <button onClick={() => { if (confirm("Delete coupon?")) del.mutate(c.id); }} className="text-destructive"><Trash2 className="h-4 w-4 inline" /></button>
                </td>
              </tr>
            ))}
            {!isLoading && (data ?? []).length === 0 && <tr><td colSpan={7} className="p-12 text-center text-muted-foreground"><Tag className="h-8 w-8 mx-auto mb-2" />No coupons yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-foreground/40 z-50 grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl mb-4">{editing.id ? "Edit" : "New"} coupon</h3>
            <div className="space-y-3">
              <input className={input} placeholder="CODE" value={editing.code} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} />
              <input className={input} placeholder="Description" value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              <div className="flex rounded-lg border border-border bg-background p-1 text-sm">
                {["percent", "flat"].map((t) => (
                  <button key={t} type="button" onClick={() => setEditing({ ...editing, type: t })} className={`flex-1 rounded-md px-4 py-2 capitalize ${editing.type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{t}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className={input} placeholder="Value" value={editing.value} onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })} />
                <input type="number" className={input} placeholder="Min order Nu. " value={editing.min_order} onChange={(e) => setEditing({ ...editing, min_order: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" className={input} placeholder="Usage limit (0 = none)" value={editing.usage_limit ?? ""} onChange={(e) => setEditing({ ...editing, usage_limit: e.target.value ? Number(e.target.value) : null })} />
                <input type="number" className={input} placeholder="Per-user limit" value={editing.per_user_limit ?? 1} onChange={(e) => setEditing({ ...editing, per_user_limit: Number(e.target.value) })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-muted-foreground">Starts at<input type="datetime-local" className={input} value={editing.starts_at ?? ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} /></label>
                <label className="text-xs text-muted-foreground">Expires at<input type="datetime-local" className={input} value={editing.expires_at ?? ""} onChange={(e) => setEditing({ ...editing, expires_at: e.target.value })} /></label>
              </div>
              <button type="button" onClick={() => setEditing({ ...editing, active: !editing.active })} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${editing.active ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                {editing.active && <Check className="h-4 w-4" />} Active
              </button>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => upsert.mutate(editing)} className="btn-hero flex-1">Save</button>
              <button onClick={() => setEditing(null)} className="btn-ghost-hero flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Reviews ----------
function ReviewsTab() {
  const listFn = useServerFn(adminListReviews);
  const setStatusFn = useServerFn(adminSetReviewStatus);
  const delFn = useServerFn(adminDeleteReview);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-reviews"], queryFn: () => listFn() });
  const setStatus = useMutation({
    mutationFn: (v: any) => setStatusFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast.success("Updated"); },
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast.success("Deleted"); },
  });
  const list = data ?? [];
  return (
    <div className="space-y-3">
      {list.length === 0 && <div className="text-center py-16 bg-card border border-border rounded-2xl text-muted-foreground"><Star className="h-8 w-8 mx-auto mb-2" />No reviews yet.</div>}
      {list.map((r: any) => (
        <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between gap-4 flex-wrap">
            <div>
              <div className="font-medium">{r.products?.name} <span className="text-xs text-muted-foreground">by {r.author_name}</span></div>
              <div className="flex items-center gap-1 mt-1 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />)}
                <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                <span className={`ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${r.status === "approved" ? "bg-primary/10 text-primary" : r.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{r.status}</span>
              </div>
              {r.title && <div className="font-medium mt-2">{r.title}</div>}
              {r.body && <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{r.body}</p>}
            </div>
            <div className="flex gap-2 h-fit">
              {["approved", "pending", "rejected"].map((s) => (
                <button key={s} onClick={() => setStatus.mutate({ id: r.id, status: s })} className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-wider ${r.status === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}>{s}</button>
              ))}
              <button onClick={() => { if (confirm("Delete review?")) del.mutate(r.id); }} className="text-destructive p-1.5"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Inventory ----------
function InventoryTab() {
  const listProdFn = useServerFn(adminListProducts);
  const moveFn = useServerFn(adminListInventoryMovements);
  const adjFn = useServerFn(adminAdjustStock);
  const qc = useQueryClient();
  const { data: products } = useQuery({ queryKey: ["admin-products"], queryFn: () => listProdFn() });
  const { data: moves } = useQuery({ queryKey: ["admin-inventory"], queryFn: () => moveFn() });
  const adj = useMutation({
    mutationFn: (v: any) => adjFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["admin-inventory"] }); toast.success("Stock updated"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const [form, setForm] = useState({ productId: "", delta: 0, reason: "Restock" });
  const input = "bg-background border border-border rounded-lg px-3 py-2 text-sm";
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2"><Boxes className="h-5 w-5 text-primary" /> Adjust stock</h3>
        <div className="space-y-3">
          <select className={`${input} w-full`} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
            <option value="">Select product…</option>
            {(products ?? []).map((p: any) => <option key={p.id} value={p.id}>{p.name} (stock: {p.stock})</option>)}
          </select>
          <input type="number" className={`${input} w-full`} placeholder="Delta (use negative to subtract)" value={form.delta} onChange={(e) => setForm({ ...form, delta: Number(e.target.value) })} />
          <input className={`${input} w-full`} placeholder="Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <button disabled={!form.productId || !form.delta} onClick={() => adj.mutate(form)} className="btn-hero w-full disabled:opacity-50">Apply</button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display text-xl mb-4">Recent movements</h3>
        <ul className="text-sm divide-y divide-border max-h-[480px] overflow-auto">
          {(moves ?? []).map((m: any) => (
            <li key={m.id} className="py-2.5 flex justify-between gap-3">
              <div>
                <div className="font-medium">{m.products?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{m.reason} · {new Date(m.created_at).toLocaleString()}</div>
              </div>
              <div className={`font-mono font-semibold ${m.delta >= 0 ? "text-primary" : "text-destructive"}`}>{m.delta > 0 ? "+" : ""}{m.delta}</div>
            </li>
          ))}
          {(moves ?? []).length === 0 && <li className="py-8 text-center text-muted-foreground">No movements yet.</li>}
        </ul>
      </div>
    </div>
  );
}

// ---------- Settings ----------
function SettingsTab() {
  const getFn = useServerFn(getAdminSettings);
  const updFn = useServerFn(updateAdminSettings);
  const testFn = useServerFn(sendTestEmail);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: () => getFn() });
  const [store, setStore] = useState<any>({});
  const [smtp, setSmtp] = useState<any>({});
  const [shipping, setShipping] = useState<any>({});
  const [payments, setPayments] = useState<any>({});
  const [testTo, setTestTo] = useState("");
  useEffect(() => {
    if (data) {
      setStore(data.store ?? { name: "Takin Mart", support_email: "" });
      setSmtp(data.smtp ?? { host: "", port: 587, user: "", pass: "", from_name: "", from_email: "", secure: false });
      const s = data.shipping ?? {};
      setShipping({ ...s, free_threshold_inr: s.free_threshold_inr ?? s.free_over ?? 1500, flat_rate_inr: s.flat_rate_inr ?? s.flat_rate ?? 99 });
      setPayments(data.payments ?? { cod_enabled: true, manual_enabled: false, razorpay_enabled: false, razorpay_mode: "test" });
    }
  }, [data]);
  const save = useMutation({
    mutationFn: (v: { key: string; value: any }) => updFn({ data: v }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-settings"] }); toast.success("Saved"); },
    onError: (e: Error) => toast.error(e.message),
  });
  const test = useMutation({
    mutationFn: () => testFn({ data: { to: testTo } }),
    onSuccess: (r: any) => r?.ok === false ? toast.error(r.error ?? "Failed (check SMTP)") : toast.success("Test email sent"),
    onError: (e: Error) => toast.error(e.message),
  });
  const input = "w-full bg-background border border-border rounded-lg px-3 py-2 text-sm";
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" /> Store info</h3>
        <div className="space-y-3">
          <input className={input} placeholder="Store name" value={store.name ?? ""} onChange={(e) => setStore({ ...store, name: e.target.value })} />
          <input className={input} placeholder="Support email" value={store.support_email ?? ""} onChange={(e) => setStore({ ...store, support_email: e.target.value })} />
          <input className={input} placeholder="Support phone" value={store.support_phone ?? ""} onChange={(e) => setStore({ ...store, support_phone: e.target.value })} />
          <button onClick={() => save.mutate({ key: "store", value: store })} className="btn-hero w-full">Save store info</button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-display text-xl mb-4">Shipping</h3>
        <div className="space-y-3">
          <input type="number" className={input} placeholder="Free shipping above Nu. " value={shipping.free_threshold_inr ?? 0} onChange={(e) => setShipping({ ...shipping, free_threshold_inr: Number(e.target.value) })} />
          <input type="number" className={input} placeholder="Flat shipping rate Nu. " value={shipping.flat_rate_inr ?? 0} onChange={(e) => setShipping({ ...shipping, flat_rate_inr: Number(e.target.value) })} />
          <button onClick={() => save.mutate({ key: "shipping", value: { ...shipping, free_over: shipping.free_threshold_inr ?? shipping.free_over ?? 1500, flat_rate: shipping.flat_rate_inr ?? shipping.flat_rate ?? 99 } })} className="btn-hero w-full">Save shipping</button>
        </div>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Payment gateway & manual payments</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {[
            ["cod_enabled", "Cash on delivery", "Accept pay-on-delivery orders"],
            ["manual_enabled", "Manual transfer", "Bank/QR/payment instructions"],
            ["razorpay_enabled", "Razorpay", "Gateway credentials and mode"],
            ["whatsapp_enabled", "WhatsApp payment", "Send order to your WhatsApp to collect payment"],
          ].map(([key, title, desc]) => (
            <button key={key} type="button" onClick={() => setPayments({ ...payments, [key]: !payments[key] })} className={`rounded-xl border p-4 text-left transition ${payments[key] ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary"}`}>
              <span className="flex items-center gap-2 font-semibold">{payments[key] && <Check className="h-4 w-4 text-primary" />}{title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{desc}</span>
            </button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Manual payment title" value={payments.manual_title ?? "Bank transfer / QR payment"} onChange={(e) => setPayments({ ...payments, manual_title: e.target.value })} />
          <input className={input} placeholder="Razorpay Key ID" value={payments.razorpay_key_id ?? ""} onChange={(e) => setPayments({ ...payments, razorpay_key_id: e.target.value })} />
          <textarea rows={4} className={`${input} sm:col-span-2`} placeholder="Manual payment instructions shown at checkout" value={payments.manual_instructions ?? ""} onChange={(e) => setPayments({ ...payments, manual_instructions: e.target.value })} />
          <input type="password" className={input} placeholder="Razorpay Key Secret" value={payments.razorpay_key_secret ?? ""} onChange={(e) => setPayments({ ...payments, razorpay_key_secret: e.target.value })} />
          <div className="flex rounded-lg border border-border bg-background p-1 text-sm">
            {["test", "live"].map((mode) => (
              <button key={mode} type="button" onClick={() => setPayments({ ...payments, razorpay_mode: mode })} className={`flex-1 rounded-md px-4 py-2 capitalize ${payments.razorpay_mode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{mode}</button>
            ))}
          </div>
          <div className="sm:col-span-2 rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
            <div className="text-sm font-semibold flex items-center gap-2">💬 WhatsApp payment</div>
            <input className={input} placeholder="WhatsApp number with country code (e.g. 97517123456)" value={payments.whatsapp_number ?? ""} onChange={(e) => setPayments({ ...payments, whatsapp_number: e.target.value.replace(/[^0-9]/g, "") })} />
            <input className={input} placeholder="Label shown at checkout" value={payments.whatsapp_title ?? "Pay via WhatsApp"} onChange={(e) => setPayments({ ...payments, whatsapp_title: e.target.value })} />
            <textarea rows={3} className={input} placeholder="Instructions shown before opening WhatsApp" value={payments.whatsapp_instructions ?? ""} onChange={(e) => setPayments({ ...payments, whatsapp_instructions: e.target.value })} />
          </div>
          <div className="sm:col-span-2 space-y-3 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">🅿️ PayPal gateway</div>
                <div className="text-xs text-muted-foreground">Paste your PayPal REST app credentials. Charged in USD.</div>
              </div>
              <button type="button" onClick={() => setPayments({ ...payments, paypal_enabled: !payments.paypal_enabled })} className={`rounded-full border px-4 py-2 text-xs font-semibold ${payments.paypal_enabled ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
                {payments.paypal_enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <input className={input} placeholder="PayPal Client ID" value={payments.paypal_client_id ?? ""} onChange={(e) => setPayments({ ...payments, paypal_client_id: e.target.value.trim() })} />
            <input type="password" className={input} placeholder="PayPal Client Secret" value={payments.paypal_client_secret ?? ""} onChange={(e) => setPayments({ ...payments, paypal_client_secret: e.target.value.trim() })} />
            <input className={input} placeholder="Label shown at checkout" value={payments.paypal_title ?? "PayPal"} onChange={(e) => setPayments({ ...payments, paypal_title: e.target.value })} />
            <div className="flex rounded-lg border border-border p-1 text-sm">
              {(["sandbox", "live"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => setPayments({ ...payments, paypal_mode: mode })} className={`flex-1 rounded-md px-4 py-2 capitalize ${(payments.paypal_mode ?? "sandbox") === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{mode}</button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">After the customer places an order, they'll be taken to the order details page and WhatsApp will open with the full order pre-filled to this number.</p>
          </div>
        </div>
        <button onClick={() => save.mutate({ key: "payments", value: payments })} className="btn-hero mt-4"><ReceiptText className="h-4 w-4" /> Save payment settings</button>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
        <h3 className="font-display text-xl mb-4 flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> SMTP (transactional emails)</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={input} placeholder="Host (smtp.gmail.com)" value={smtp.host ?? ""} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
          <input type="number" className={input} placeholder="Port (587)" value={smtp.port ?? 587} onChange={(e) => setSmtp({ ...smtp, port: Number(e.target.value) })} />
          <input className={input} placeholder="Username" value={smtp.user ?? ""} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
          <input type="password" className={input} placeholder="Password / app password" value={smtp.pass ?? ""} onChange={(e) => setSmtp({ ...smtp, pass: e.target.value })} />
          <input className={input} placeholder="From name" value={smtp.from_name ?? ""} onChange={(e) => setSmtp({ ...smtp, from_name: e.target.value })} />
          <input className={input} placeholder="From email" value={smtp.from_email ?? ""} onChange={(e) => setSmtp({ ...smtp, from_email: e.target.value })} />
          <label className="text-xs text-muted-foreground flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={!!smtp.secure} onChange={(e) => setSmtp({ ...smtp, secure: e.target.checked })} /> Use TLS (port 465)
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => save.mutate({ key: "smtp", value: smtp })} className="btn-hero">Save SMTP</button>
          <div className="flex-1 min-w-[220px] flex gap-2">
            <input className={input} placeholder="Test recipient email" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <button disabled={!testTo || test.isPending} onClick={() => test.mutate()} className="btn-ghost-hero disabled:opacity-50">Send test</button>
          </div>
        </div>
      </div>
    </div>
  );
}
