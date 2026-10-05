import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyReviews, deleteMyReview } from "@/lib/account.functions";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { resolveAsset } from "@/lib/asset-map";

export const Route = createFileRoute("/_authenticated/my-reviews")({
  head: () => ({ meta: [{ title: "My Reviews — Takin Mart" }] }),
  component: MyReviewsPage,
});

function MyReviewsPage() {
  const fetchFn = useServerFn(listMyReviews);
  const delFn = useServerFn(deleteMyReview);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-reviews"], queryFn: () => fetchFn() });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["my-reviews"] }); toast.success("Review deleted"); },
  });
  const list = data ?? [];
  return (
    <div className="container-page py-12 max-w-3xl">
      <h1 className="font-display text-4xl">My Reviews</h1>
      <p className="text-muted-foreground mt-2 mb-8"><Link to="/account" className="hover:text-primary">My Account</Link></p>
      {list.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Star className="h-10 w-10 mx-auto text-primary mb-3" />
          <p className="text-muted-foreground">You haven't written any reviews yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((r: any) => (
            <li key={r.id} className="bg-card border border-border rounded-2xl p-5 flex gap-4">
              {r.products?.image_url && <img src={resolveAsset(r.products.image_url)} alt="" className="h-16 w-16 rounded-xl object-contain bg-white" />}
              <div className="flex-1">
                <Link to="/product/$slug" params={{ slug: r.products?.slug ?? "" }} className="font-display text-lg hover:text-primary">{r.products?.name}</Link>
                <div className="flex items-center gap-1 mt-1 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-current" : "opacity-30"}`} />)}
                  <span className="text-xs text-muted-foreground ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.status !== "approved" && <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{r.status}</span>}
                </div>
                {r.title && <div className="font-medium mt-2">{r.title}</div>}
                {r.body && <p className="text-sm text-muted-foreground mt-1">{r.body}</p>}
              </div>
              <button onClick={() => { if (confirm("Delete review?")) del.mutate(r.id); }} className="text-destructive p-2 hover:bg-muted rounded-lg h-fit"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
