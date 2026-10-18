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
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border/70 transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-hover)] hover:border-primary/40 flex flex-col h-full">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square overflow-hidden bg-[#FAF7F2] dark:bg-muted/30 relative"
      >
        {product.badge && (
          <span className="absolute top-3 left-3 z-10 bg-[#163820] text-white text-[10px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {product.badge}
          </span>
        )}
        {onSale && !outOfStock && (
          <span className="absolute top-3 right-3 z-10 bg-gold text-gold-foreground text-[10px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full shadow-sm">
            {off}% off
          </span>
        )}
        {outOfStock && (
          <span className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground text-[10px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full">
            Sold out
          </span>
        )}
        {product.image_url && (
          <img
            src={resolveAsset(product.image_url)}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-3 transition-transform duration-[600ms] ease-out group-hover:scale-105"
          />
        )}

        {/* Quick add floating action button (desktop only to prevent mobile clutter) */}
        <button
          onClick={handleAdd}
          disabled={outOfStock}
          aria-label={`Quick add ${product.name}`}
          className="hidden sm:grid absolute bottom-3 right-3 z-10 h-8 w-8 place-items-center rounded-full bg-[#163820] text-white shadow-md hover:bg-[#0f2816] transition-transform active:scale-95 disabled:opacity-40"
        >
          <ShoppingBag className="h-4 w-4" />
        </button>
      </Link>

      <div className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-h-[16px]">
            <Star className="h-3.5 w-3.5 fill-[#D4A373] text-[#D4A373] shrink-0" />
            <span className="font-bold text-foreground text-xs">{rating > 0 ? rating.toFixed(1) : "4.9"}</span>
            <span className="text-muted-foreground font-normal text-[11px] truncate">· {product.rating_count ?? 32} reviews</span>
          </div>

          <Link to="/product/$slug" params={{ slug: product.slug }}>
            <h3 className="font-display text-sm sm:text-base md:text-lg font-semibold text-foreground leading-snug mt-1.5 line-clamp-2 sm:line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <div className="mt-1 text-[11px] sm:text-xs font-medium text-[#2E7D32]">
            {outOfStock ? (
              <span className="text-destructive">Out of stock</span>
            ) : lowStock ? (
              <span className="text-gold-foreground">Only {product.stock} left</span>
            ) : (
              "In stock"
            )}
          </div>
          {product.tagline && (
            <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 line-clamp-1 hidden sm:block">{product.tagline}</p>
          )}
        </div>

        <div className="mt-3 pt-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border/40">
          <div className="flex min-w-0 items-baseline gap-x-1">
            <span className="font-display text-base sm:text-lg md:text-xl font-bold text-foreground whitespace-nowrap">
              {formatMoney(price, country)}
            </span>
            {onSale && (
              <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                {formatMoney(compareAt!, country)}
              </span>
            )}
            <span className="text-[10px] sm:text-xs text-muted-foreground truncate">/ {product.unit}</span>
          </div>
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className="w-full sm:w-auto shrink-0 rounded-full bg-[#163820] text-white sm:bg-[#EFECE6] sm:text-[#163820] sm:hover:bg-[#163820] sm:hover:text-white px-3 py-2 sm:py-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center justify-center gap-1 active:scale-95 min-h-[36px] sm:min-h-0"
          >
            <ShoppingBag className="h-3 w-3 sm:hidden" />
            <span>{outOfStock ? "Sold out" : "+ ADD"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
