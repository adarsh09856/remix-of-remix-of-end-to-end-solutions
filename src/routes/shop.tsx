import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listCategories, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";

const productsQuery = () => queryOptions({ queryKey: ["products", "all"], queryFn: () => listProducts({ data: {} }) });
const categoriesQuery = () => queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop All — Takin Mart" },
      { name: "description", content: "Browse our complete collection of authentic Bhutanese agro products — grains, honey, spices, teas, dried foods and more." },
      { property: "og:title", content: "Shop All — Takin Mart" },
      { property: "og:description", content: "All authentic Bhutanese agro products in one place." },
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
    let list = products as any[];
    if (filter) list = list.filter((p) => p.categories?.slug === filter);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "price-asc") list = [...list].sort((a, b) => Number(a.price_inr) - Number(b.price_inr));
    if (sort === "price-desc") list = [...list].sort((a, b) => Number(b.price_inr) - Number(a.price_inr));
    return list;
  }, [products, filter, q, sort]);

  return (
    <div className="container-page py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="eyebrow">Our Collection</span>
        <h1 className="font-display text-5xl mt-2">Shop All</h1>
        <p className="text-muted-foreground mt-3">Every product handpicked from Bhutan's farms.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-8">
        <input
          type="search"
          placeholder="Search products…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 bg-card border border-border rounded-full px-5 py-3 text-sm outline-none focus:border-primary"
        />
        <div className="flex rounded-full border border-border bg-card p-1 text-sm">
          {[
            ["new", "Newest"],
            ["price-asc", "Nu. Low"],
            ["price-desc", "Nu. High"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value as typeof sort)}
              className={`rounded-full px-4 py-2 transition ${sort === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setFilter(null)}
          className={`px-4 py-1.5 rounded-full text-sm border transition ${!filter ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
        >
          All
        </button>
        {cats.map((c) => (
          <button
            key={c.id}
            onClick={() => setFilter(c.slug)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${filter === c.slug ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-20">No products match your search.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    </div>
  );
}
