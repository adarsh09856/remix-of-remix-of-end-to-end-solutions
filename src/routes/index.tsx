import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCategories, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight, Leaf, ShieldCheck, Truck, Sprout } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroProducts from "@/assets/hero-products.png";
import farmer from "@/assets/farmer.jpg";
import { resolveAsset } from "@/lib/asset-map";

const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const popularQuery = () =>
  queryOptions({ queryKey: ["products", "all"], queryFn: () => listProducts({ data: {} }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Takin Mart — Pure by Nature. Grown in Bhutan." },
      { name: "description", content: "Authentic agro products from the pristine Bhutanese Himalayas — red rice, wild honey, hand-blended spices, and high-grown teas, delivered across Bhutan." },
      { property: "og:title", content: "Takin Mart — Pure by Nature. Grown in Bhutan." },
      { property: "og:description", content: "Authentic Bhutanese agro products from farmer to your home." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(popularQuery()),
    ]);
  },
  component: Home,
});

function Home() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <Categories />
      <Popular />
      <FarmStory />
      <Trust />
    </>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream">
      <div className="absolute inset-0 -z-10">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-40" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/70 to-cream" />
      </div>

      {/* editorial metadata bar */}
      <div className="container-page pt-10 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-primary/70 font-semibold">
        <span>Vol. 01 · Himalayan Harvest</span>
        <span className="hidden sm:inline">Est. Bhutan · 2026</span>
        <span>№ 001</span>
      </div>

      <div className="container-page pt-10 pb-16 md:pt-14 md:pb-24 grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 relative z-10">
          <span className="eyebrow">Bhutan · From the Himalayas</span>
          <h1 className="font-display font-semibold text-primary leading-[0.9] tracking-[-0.04em] mt-5 text-[clamp(3rem,9vw,7.5rem)]">
            Pure by <em className="not-italic text-gold font-normal italic">nature.</em>
            <br />
            Grown in <span className="relative inline-block">
              Bhutan.
              <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                <path d="M2 8 Q 60 2 100 6 T 198 5" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <div className="mt-8 grid sm:grid-cols-[auto_1fr] gap-6 items-start max-w-2xl">
            <div className="h-px sm:h-full sm:w-px bg-primary/25 sm:mx-2" />
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed font-light">
              Authentic agro products from the pristine Himalayas — red rice, wild honey, hand-blended spices and high-grown teas, sourced directly from the farmers who grow them.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 items-center">
            <Link to="/shop" className="btn-hero">
              Shop the Harvest <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/story" className="btn-ghost-hero">Read Our Story</Link>
          </div>

          <ul className="mt-12 flex flex-wrap gap-x-10 gap-y-4 text-sm border-t border-primary/15 pt-6">
            {[
              ["100% Authentic", "Made in Bhutan"],
              ["Farm Fresh", "From our farmers"],
              ["Sustainable", "For a better tomorrow"],
            ].map(([t, s]) => (
              <li key={t} className="flex items-start gap-2.5">
                <Leaf className="h-4 w-4 text-gold mt-0.5" />
                <div>
                  <div className="font-semibold text-foreground">{t}</div>
                  <div className="text-xs text-muted-foreground">{s}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-primary/10 shadow-[var(--shadow-hover)]">
            <img
              src={heroProducts}
              alt="Curated Bhutanese products"
              width={1280}
              height={1280}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent p-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-cream/90 font-semibold">This Season</span>
              <div className="font-display text-2xl text-cream mt-1">Red Rice · Wild Honey · Timur</div>
            </div>
          </div>

          {/* floating seal */}
          <div className="absolute -top-4 -left-4 h-28 w-28 rounded-full bg-cream border border-gold/50 grid place-items-center text-center shadow-[var(--shadow-soft)] rotate-[-8deg]">
            <div>
              <div className="text-gold font-display text-lg leading-none">Bhutan</div>
              <div className="text-[9px] font-semibold uppercase tracking-widest text-primary mt-1">100% Natural</div>
            </div>
          </div>

          {/* floating pull-quote */}
          <div className="hidden md:block absolute -bottom-8 -right-4 max-w-[240px] bg-card border border-border rounded-2xl p-4 shadow-[var(--shadow-soft)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold font-semibold">Field Note</div>
            <p className="font-display text-sm mt-1 leading-snug">
              "Grown at 2,400m — cool nights, mineral soil, unhurried harvests."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueStrip() {
  const items = [
    { icon: Sprout, title: "Authentic Origin", desc: "Sourced directly from Bhutanese farmers" },
    { icon: Leaf, title: "Chemical Free", desc: "Natural & chemical-free products" },
    { icon: ShieldCheck, title: "Sustainable Farming", desc: "Supporting traditional livelihoods" },
    { icon: Truck, title: "Secure Delivery", desc: "Safe shipping across Bhutan" },
  ];
  return (
    <section className="container-page -mt-10 relative z-10">
      <div className="bg-card border border-border rounded-3xl shadow-[var(--shadow-soft)] grid grid-cols-2 md:grid-cols-4 gap-4 p-6 md:p-8">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-secondary grid place-items-center shrink-0">
              <it.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm">{it.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Categories() {
  const { data: cats } = useSuspenseQuery(categoriesQuery());
  return (
    <section className="container-page py-20">
      <div className="text-center max-w-xl mx-auto mb-12">
        <span className="eyebrow">Explore</span>
        <h2 className="font-display text-4xl md:text-5xl mt-2">Shop by Category</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 lg:gap-6 max-w-6xl mx-auto">
        {cats.map((c) => (
          <Link
            key={c.id}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className="group flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden bg-secondary border-2 border-border/70 group-hover:border-primary group-hover:scale-105 transition-all shadow-sm">
              {c.image_url && (
                <img src={resolveAsset(c.image_url)} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="mt-3 text-xs sm:text-sm font-medium leading-tight group-hover:text-primary transition-colors">{c.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Popular() {
  const { data: products } = useSuspenseQuery(popularQuery());
  return (
    <section className="container-page py-12">
      <div className="flex items-end justify-between mb-10">
        <div>
          <span className="eyebrow">Best Sellers</span>
          <h2 className="font-display text-4xl md:text-5xl mt-2">Popular Products</h2>
        </div>
        <Link to="/shop" className="text-sm text-primary font-medium inline-flex items-center gap-1.5 hover:gap-2 transition-all">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p as any} />
        ))}
      </div>
    </section>
  );
}

function FarmStory() {
  return (
    <section className="container-page py-20">
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="relative rounded-3xl overflow-hidden min-h-[480px]">
          <img src={farmer} alt="Bhutanese farmer in tea garden" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/75 to-primary/25" />
          <div className="absolute bottom-8 left-8 right-8 text-primary-foreground">
            <span className="eyebrow" style={{ color: "var(--gold)" }}>Our Farmers</span>
            <h3 className="font-display text-3xl md:text-4xl mt-2 leading-tight drop-shadow-md">
              From Our Farms <br />to Your Family
            </h3>
            <p className="text-sm opacity-95 mt-3 max-w-sm leading-relaxed">
              We work closely with Bhutanese farmers to bring you the finest agro-based products that are
              pure, authentic, and sustainably grown.
            </p>
            <Link to="/story" className="inline-flex mt-5 items-center gap-1.5 bg-cream text-primary px-5 py-2.5 rounded-full text-sm font-medium hover:gap-2.5 transition-all shadow-lg">
              Know Our Story <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { t: "Supporting Farmers", d: "Empowering rural communities and promoting fair trade." },
            { t: "Clean & Green Bhutan", d: "Grown in the pristine Himalayan environment." },
            { t: "Quality You Can Trust", d: "Carefully selected, tested and packed with care." },
            { t: "Delivering Happiness", d: "Bringing the goodness of Bhutan to your doorstep." },
          ].map((c) => (
            <div key={c.t} className="bg-secondary/60 border border-border rounded-2xl p-6">
              <div className="h-10 w-10 rounded-full bg-card grid place-items-center mb-4">
                <Leaf className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-display text-xl">{c.t}</h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{c.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    ["100% Authentic", "Made in Bhutan"],
    ["Secure Payments", "100% Secure & Safe"],
    ["Easy Returns", "Hassle-free returns"],
    ["Customer Support", "+975 17 17 17 17"],
  ];
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="container-page py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map(([t, s]) => (
          <div key={t} className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-gold shrink-0" />
            <div>
              <div className="font-semibold text-gold text-sm">{t}</div>
              <div className="text-xs opacity-80">{s}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
