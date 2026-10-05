import { resolveAsset } from "@/lib/asset-map";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getCategoryBySlug } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";

const catQuery = (slug: string) =>
  queryOptions({ queryKey: ["category", slug], queryFn: () => getCategoryBySlug({ data: { slug } }) });

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ context, params }) => {
    const c = await context.queryClient.ensureQueryData(catQuery(params.slug));
    if (!c) throw notFound();
    return { category: c.category };
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.category
      ? [
          { title: `${loaderData.category.name} — Takin Mart` },
          { name: "description", content: loaderData.category.description ?? `Shop authentic ${loaderData.category.name} from Bhutan.` },
          { property: "og:title", content: `${loaderData.category.name} — Takin Mart` },
          { property: "og:description", content: loaderData.category.description ?? "" },
          { property: "og:image", content: loaderData.category.image_url ?? "" },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl">Category not found</h1>
      <Link to="/shop" className="btn-hero mt-6">Back to shop</Link>
    </div>
  ),
  errorComponent: () => <div className="container-page py-24 text-center">Couldn't load category</div>,
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(catQuery(slug));
  if (!data) return null;
  const { category, products } = data;
  return (
    <div>
      <section className="relative h-72 overflow-hidden">
        {category.image_url && <img src={resolveAsset(category.image_url)} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/40" />
        <div className="relative container-page h-full flex flex-col justify-end pb-10 text-primary-foreground">
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Category</span>
          <h1 className="font-display text-5xl mt-2">{category.name}</h1>
          {category.description && <p className="mt-2 max-w-xl opacity-90">{category.description}</p>}
        </div>
      </section>
      <div className="container-page py-12">
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">No products in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p) => <ProductCard key={p.id} product={p as any} />)}
          </div>
        )}
      </div>
    </div>
  );
}
