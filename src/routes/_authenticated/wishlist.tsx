import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyWishlist, toggleWishlist } from "@/lib/account.functions";
import { formatMoney, pickPrice, useCountry } from "@/lib/country";
import { resolveAsset } from "@/lib/asset-map";
import { addLocalCartItem } from "@/lib/local-cart";
import { toast } from "sonner";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — Takin Mart" }] }),
  component: WishlistPage,
});

function WishlistPage() {
  const fetchFn = useServerFn(listMyWishlist);
  const toggleFn = useServerFn(toggleWishlist);
  const [country] = useCountry();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-wishlist"], queryFn: () => fetchFn() });

  const removeMut = useMutation({
    mutationFn: (productId: string) => toggleFn({ data: { productId } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-wishlist"] }); toast.success("Removed"); },
  });

  const items = (data ?? []).map((r: any) => r.products).filter(Boolean);

  return (
    <div className="container-page py-12">
      <h1 className="font-display text-4xl">My Wishlist</h1>
      <p className="text-muted-foreground mt-2 mb-8"><Link to="/account" className="hover:text-primary">My Account</Link> · {items.length} item{items.length === 1 ? "" : "s"}</p>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Heart className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Link to="/shop" className="btn-hero mt-6">Discover products</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden group">
              <Link to="/product/$slug" params={{ slug: p.slug }} className="relative block aspect-square product-stage">
                {p.image_url && <img src={resolveAsset(p.image_url)} alt={p.name} className="absolute inset-0 h-full w-full object-contain group-hover:scale-105 transition" />}
              </Link>

              <div className="p-4">
                <Link to="/product/$slug" params={{ slug: p.slug }} className="font-display text-lg leading-snug hover:text-primary">{p.name}</Link>
                <div className="mt-1 text-primary font-semibold">{formatMoney(pickPrice(p, country), country)} <span className="text-xs text-muted-foreground font-normal">/ {p.unit}</span></div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => { addLocalCartItem(p, 1); toast.success("Added to cart"); }} className="btn-hero flex-1 text-xs"><ShoppingBag className="h-3.5 w-3.5" /> Add</button>
                  <button onClick={() => removeMut.mutate(p.id)} className="text-destructive p-2 hover:bg-muted rounded-lg"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
