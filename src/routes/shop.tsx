import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listCategories, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import {
  Search, X, ShieldCheck, Leaf, Sparkles, Filter, ArrowUpDown, ChevronRight,
  HeartHandshake, Truck
} from "lucide-react";

const productsQuery = () => queryOptions({ queryKey: ["products", "all"], queryFn: () => listProducts({ data: {} }) });
const categoriesQuery = () => queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "The Himalayan Harvest Collection — Takin Mart" },
      {
        name: "description",
        content:
          "Browse our curated collection of authentic Bhutanese agro products — pure Shilajit, wild Putka honey, Cordyceps tea, heritage red rice, and mountain spices.",
      },
      { property: "og:title", content: "The Himalayan Harvest Collection — Takin Mart" },
      { property: "og:description", content: "Pure by nature, grown in Bhutan. 100% authentic Himalayan harvest." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]);
  },
  component: Shop,
});

function Shop() {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: cats } = useSuspenseQuery(categoriesQuery());
  const [filter, setFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    let list = (products || []) as any[];
    if (filter) {
      list = list.filter((p) => p.categories?.slug === filter || p.category_id === filter);
    }
    if (q.trim()) {
      const search = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.categories?.name?.toLowerCase().includes(search)
      );
    }
    if (sort === "price-asc") list = [...list].sort((a, b) => Number(a.price_inr) - Number(b.price_inr));
    if (sort === "price-desc") list = [...list].sort((a, b) => Number(b.price_inr) - Number(a.price_inr));
    return list;
  }, [products, filter, q, sort]);

  // Product counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (products || []).forEach((p: any) => {
      const slug = p.categories?.slug;
      if (slug) counts[slug] = (counts[slug] || 0) + 1;
    });
    return counts;
  }, [products]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Editorial Catalog Header */}
      <div className="relative border-b border-border bg-gradient-to-b from-secondary/40 to-background py-12 md:py-16">
        <div className="container-page">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link to="/" className="hover:text-primary transition">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Himalayan Harvest Collection</span>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-semibold mb-3">
              <Sparkles className="h-3.5 w-3.5 text-gold" />
              <span>Direct from Bhutan's Valleys & Mountain Highlands</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              The Himalayan Harvest
            </h1>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Every jar of raw honey, block of high-altitude Shilajit, and sack of Paro red rice is
              cultivated without synthetic chemicals, nourished by glacial snowmelt, and packed with care in Bhutan.
            </p>
          </div>
        </div>
      </div>

      <div className="container-page py-10">
        {/* Search & Sort Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between mb-8">
          {/* Search Box */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search wild honey, cordyceps, red rice, shilajit, pickles…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full bg-card border border-border rounded-2xl pl-11 pr-10 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-soft transition"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <ArrowUpDown className="h-3.5 w-3.5" /> Sort:
            </span>
            <div className="flex rounded-xl border border-border bg-card p-1 shadow-soft text-xs">
              {[
                ["new", "Featured"],
                ["price-asc", "Price: Low to High"],
                ["price-desc", "Price: High to Low"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSort(value as typeof sort)}
                  className={`rounded-lg px-3 py-1.5 font-medium transition ${
                    sort === value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <button
            onClick={() => setFilter(null)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition shadow-soft flex items-center gap-1.5 ${
              !filter
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            <span>All Harvest</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${!filter ? "bg-white/20" : "bg-muted"}`}>
              {products?.length ?? 0}
            </span>
          </button>
          {cats.map((c) => {
            const count = categoryCounts[c.slug] || 0;
            const active = filter === c.slug;
            return (
              <button
                key={c.id || c.slug}
                onClick={() => setFilter(active ? null : c.slug)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition shadow-soft flex items-center gap-1.5 ${
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground"
                }`}
              >
                <span>{c.name}</span>
                {count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? "bg-white/20" : "bg-muted"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Results Counter & Active Filter Badge */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-6 pb-3 border-b border-border">
          <div>
            Showing <strong className="text-foreground">{filtered.length}</strong> of{" "}
            <strong>{products?.length ?? 0}</strong> authentic Himalayan products
            {filter && (
              <span className="ml-2 inline-flex items-center gap-1 bg-gold/15 text-gold px-2 py-0.5 rounded-full font-semibold">
                Category: {cats.find((c) => c.slug === filter)?.name || filter}
                <button onClick={() => setFilter(null)} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
          {(q || filter) && (
            <button
              onClick={() => { setQ(""); setFilter(null); }}
              className="text-primary hover:underline font-semibold"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Product Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 bg-card border border-border rounded-3xl p-12 max-w-lg mx-auto shadow-soft">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto grid place-items-center mb-4">
              <Filter className="h-7 w-7 text-gold" />
            </div>
            <h3 className="font-display text-xl font-bold">No products found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              We couldn't find any products matching your search "{q}". Try clearing filters or searching for popular items like "honey" or "shilajit".
            </p>
            <button
              onClick={() => { setQ(""); setFilter(null); }}
              className="btn-hero mt-6 inline-flex"
            >
              View All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Guarantees Strip at bottom */}
        <div className="mt-20 pt-10 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <ShieldCheck className="h-7 w-7 text-gold mx-auto mb-2" />
            <h4 className="font-semibold text-sm">BAFRA Certified</h4>
            <p className="text-xs text-muted-foreground mt-1">100% chemical-free organic harvest</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <Leaf className="h-7 w-7 text-emerald-600 mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Carbon-Negative</h4>
            <p className="text-xs text-muted-foreground mt-1">Grown in Bhutan's pristine soil</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <HeartHandshake className="h-7 w-7 text-gold mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Fair Farmer Trade</h4>
            <p className="text-xs text-muted-foreground mt-1">Ethical prices paid to growers</p>
          </div>
          <div className="p-4 rounded-2xl bg-card border border-border">
            <Truck className="h-7 w-7 text-primary mx-auto mb-2" />
            <h4 className="font-semibold text-sm">Kingdom Delivery</h4>
            <p className="text-xs text-muted-foreground mt-1">Dispatched to all 20 Dzongkhags</p>
          </div>
        </div>
      </div>
    </div>
  );
}
