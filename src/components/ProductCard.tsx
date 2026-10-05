import { Link } from "@tanstack/react-router";
import { ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { formatMoney, pickPrice, pickCompareAt, useCountry } from "@/lib/country";
import { resolveAsset } from "@/lib/asset-map";
import { addLocalCartItem } from "@/lib/local-cart";

type Product = {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  price_inr: number | string;
  price_in?: number | string | null;
  price_us?: number | string | null;
  unit: string;
  image_url?: string | null;
  badge?: string | null;
  rating_avg?: number | string | null;
  rating_count?: number | null;
  stock?: number | null;
  low_stock_threshold?: number | null;
  compare_at_inr?: number | string | null;
  compare_at_in?: number | string | null;
  compare_at_us?: number | string | null;
};

export function ProductCard({ product }: { product: Product }) {
  const [country] = useCountry();
  const price = pickPrice(product, country);
  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addLocalCartItem(product, 1);
    toast.success(`${product.name} added to cart`);
  };

  const rating = Number(product.rating_avg ?? 0);
  const outOfStock = typeof product.stock === "number" && product.stock <= 0;
  const lowStockAt = Number(product.low_stock_threshold ?? 5);
  const lowStock = !outOfStock && typeof product.stock === "number" && product.stock <= lowStockAt;
  const compareAt = pickCompareAt(product, country);
  const onSale = compareAt != null && compareAt > price;
  const off = onSale ? Math.round(((compareAt! - price) / compareAt!) * 100) : 0;

  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] hover:border-primary/40">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square overflow-hidden product-stage relative"
      >
        {product.badge && (
          <span className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {product.badge}
          </span>
        )}
        {onSale && !outOfStock && (
          <span className="absolute top-3 right-3 z-10 bg-gold text-gold-foreground text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {off}% off
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground text-[10px] uppercase tracking-[0.15em] font-semibold px-2.5 py-1 rounded-full">
            Sold out
          </span>
        )}
        {product.image_url && (
          <img
            src={resolveAsset(product.image_url)}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain transition-transform duration-[600ms] ease-out group-hover:scale-105"
          />
        )}




        {/* quick add — appears on hover */}
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={`Quick add ${product.name}`}
          className="absolute bottom-3 right-3 h-11 w-11 grid place-items-center rounded-full bg-primary text-primary-foreground shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-glow disabled:opacity-40"
        >
          <ShoppingBag className="h-[18px] w-[18px]" />
        </button>
      </Link>

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-h-[16px]">
          {rating > 0 && (
            <>
              <Star className="h-3 w-3 fill-gold text-gold" />
              <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
              {product.rating_count ? <span>· {product.rating_count} reviews</span> : null}
            </>
          )}
        </div>

        <Link to="/product/$slug" params={{ slug: product.slug }}>
          <h3 className="font-display text-lg font-semibold text-foreground leading-tight mt-1 line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 text-[11px] font-semibold">
          {outOfStock ? (
            <span className="text-destructive">Out of stock</span>
          ) : lowStock ? (
            <span className="text-gold-foreground">Only {product.stock} left</span>
          ) : (
            <span className="text-primary">In stock</span>
          )}
        </div>
        {product.tagline && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{product.tagline}</p>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span className="text-primary font-display text-lg sm:text-xl font-semibold whitespace-nowrap">{formatMoney(price, country)}</span>
            {onSale && <span className="text-xs text-muted-foreground line-through">{formatMoney(compareAt!, country)}</span>}
            <span className="text-xs text-muted-foreground truncate">/ {product.unit}</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="self-start sm:self-auto shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-40"
          >
            {outOfStock ? "Sold out" : "+ Add"}
          </button>
        </div>


      </div>
    </div>
  );
}
