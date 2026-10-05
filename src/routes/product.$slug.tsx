import { resolveAsset } from "@/lib/asset-map";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { getProductBySlug } from "@/lib/products.functions";
import { formatMoney, pickPrice, pickCompareAt, useCountry, COUNTRIES, getCountryMeta } from "@/lib/country";
import { ShoppingBag, Plus, Minus, Leaf, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { addLocalCartItem } from "@/lib/local-cart";

const productQuery = (slug: string) =>
  queryOptions({ queryKey: ["product", slug], queryFn: () => getProductBySlug({ data: { slug } }) });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const p = await context.queryClient.ensureQueryData(productQuery(params.slug));
    if (!p) throw notFound();
    return { product: p };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.product
      ? [
        { title: `${loaderData.product.name} — Takin Mart` },
        { name: "description", content: loaderData.product.tagline ?? loaderData.product.description?.slice(0, 160) ?? "" },
        { property: "og:title", content: `${loaderData.product.name} — Takin Mart` },
        { property: "og:description", content: loaderData.product.tagline ?? "" },
        { property: "og:image", content: loaderData.product.image_url ?? "" },
        { name: "twitter:image", content: loaderData.product.image_url ?? "" },
      ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl">Product not found</h1>
      <Link to="/shop" className="btn-hero mt-6">Back to shop</Link>
    </div>
  ),
  errorComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl">Couldn't load product</h1>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [country, setCountry] = useCountry();
  const countryMeta = getCountryMeta(country);

  if (!product) return null;

  const images = Array.from(new Set([product.image_url, ...((Array.isArray((product as any).gallery) ? (product as any).gallery : []) as string[])].filter(Boolean))) as string[];
  const activeImage = selectedImage ?? images[0];

  const handleAdd = () => {
    addLocalCartItem(product, qty);
    toast.success(`Added ${qty} × ${product.name}`);
  };

  return (
    <div className="container-page py-12">
      <nav className="text-xs text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">Home</Link> /{" "}
        <Link to="/shop" className="hover:text-primary">Shop</Link>
        {(product as any).categories && (
          <> / <Link to="/category/$slug" params={{ slug: (product as any).categories.slug }} className="hover:text-primary">{(product as any).categories.name}</Link></>
        )}
        {" / "}<span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square rounded-3xl overflow-hidden product-stage border border-border relative">
            {activeImage && <img src={resolveAsset(activeImage)} alt={product.name} className="absolute inset-0 h-full w-full object-contain" />}
          </div>
          {images.length > 1 && (
            <div className="mt-3 grid grid-cols-5 gap-2">
              {images.map((image) => (
                <button key={image} type="button" onClick={() => setSelectedImage(image)} className={`relative aspect-square overflow-hidden rounded-xl border product-stage ${activeImage === image ? "border-primary" : "border-border"}`}>
                  <img src={resolveAsset(image)} alt={`${product.name} gallery`} className="absolute inset-0 h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}


        </div>

        <div>
          {product.badge && (
            <span className="inline-block bg-gold/15 text-gold-foreground border border-gold/40 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold">
              {product.badge}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-5xl mt-3 leading-tight">{product.name}</h1>
          {product.tagline && <p className="text-muted-foreground mt-2">{product.tagline}</p>}

          {(() => {
            const price = pickPrice(product, country);
            const compareAt = pickCompareAt(product, country);
            const onSale = compareAt != null && compareAt > price;
            const stock = Number((product as any).stock ?? 0);
            const lowAt = Number((product as any).low_stock_threshold ?? 5);
            return (
              <>
                <div className="mt-6 flex flex-wrap items-baseline gap-2">
                  <span className="text-3xl font-semibold text-primary">{formatMoney(price, country)}</span>
                  {onSale && (
                    <>
                      <span className="text-base text-muted-foreground line-through">{formatMoney(compareAt!, country)}</span>
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-gold-foreground">
                        {Math.round(((compareAt! - price) / compareAt!) * 100)}% off
                      </span>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">/ {product.unit}</span>
                </div>
                <div className="mt-2 text-sm font-semibold">
                  {stock <= 0 ? (
                    <span className="text-destructive">Out of stock — currently unavailable</span>
                  ) : stock <= lowAt ? (
                    <span className="text-gold-foreground">Hurry — only {stock} left in stock</span>
                  ) : (
                    <span className="text-primary">In stock · ready to ship</span>
                  )}
                </div>
              </>
            );
          })()}

          <div className="mt-5 rounded-2xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Ship to & price in</div>
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
            <p className="mt-2 text-[11px] text-muted-foreground">Showing price in {countryMeta.currency}. Change anytime.</p>
          </div>

          {product.description && (
            <p className="mt-6 text-foreground/80 leading-relaxed whitespace-pre-line">{product.description}</p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-border rounded-full">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3 hover:bg-muted rounded-l-full"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button onClick={() => setQty((q) => Math.min(99, q + 1))} className="p-3 hover:bg-muted rounded-r-full"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={handleAdd} className="btn-hero flex-1 max-w-xs">
              <ShoppingBag className="h-4 w-4" /> Add to Cart
            </button>
          </div>

          <ul className="mt-10 space-y-3 text-sm border-t border-border pt-6">
            <li className="flex items-center gap-3"><Leaf className="h-4 w-4 text-primary" /> 100% natural, chemical-free</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-4 w-4 text-primary" /> Sourced directly from Bhutanese farmers</li>
            <li className="flex items-center gap-3"><Truck className="h-4 w-4 text-primary" /> Free shipping on orders over Nu. 1,500</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
