import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { listCategories, listProducts } from "@/lib/products.functions";
import { ProductCard } from "@/components/ProductCard";
import {
  ArrowRight, Leaf, ShieldCheck, Truck, Sprout, Star, Sparkles, ShoppingBag,
  Award, Heart, CheckCircle2, Copy, Search, ExternalLink, ChevronRight, MessageSquare
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroProducts from "@/assets/hero-products.png";
import farmer from "@/assets/farmer.jpg";
import promoBanner from "@/assets/promo-banner.png";
import { resolveAsset, resolveCategoryAsset } from "@/lib/asset-map";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: () => listCategories() });
const popularQuery = () =>
  queryOptions({ queryKey: ["products", "all"], queryFn: () => listProducts({ data: {} }) });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Takin Mart — Pure by Nature. Grown in Bhutan." },
      {
        name: "description",
        content:
          "Official Takin Mart Himalayan Harvest. Authentic agro-wellness treasures direct from Bhutan — pure Shilajit, wild Puthka honey, cordyceps tea, heritage red rice, and organic spices delivered across the Kingdom.",
      },
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
    <div className="bg-background text-foreground min-h-screen">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Value Proposition Strip */}
      <ValueStrip />

      {/* 3. Circular Category Navigation (The 7 Authentic Categories) */}
      <Categories />

      {/* 4. Festive Tshechu Promotional Spotlight */}
      <FestiveSpotlight />

      {/* 5. Curated Harvest Showcase (Filtered Tabs) */}
      <CuratedShowcase />

      {/* 6. Himalayan Farmer Heritage Story */}
      <FarmStory />

      {/* 7. Verified Customer Feedback */}
      <CustomerReviews />

      {/* 8. Harvest Club VIP Newsletter */}
      <HarvestClub />

      {/* 9. Trust & Guarantees Strip */}
      <Trust />
    </div>
  );
}


function Hero() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate({ to: "/shop", search: { q: query.trim() } as any });
    }
  };

  return (
    <section className="relative overflow-hidden bg-cream py-10 md:py-16">
      <div className="absolute inset-0 -z-10">
        <img src={heroBg} alt="" className="h-full w-full object-cover opacity-35" width={1920} height={1080} />
        <div className="absolute inset-0 bg-gradient-to-b from-cream via-cream/80 to-cream" />
      </div>

      <div className="container-page grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        <div className="lg:col-span-7 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3.5 py-1 text-xs font-semibold text-primary backdrop-blur-md mb-4">
            <Sparkles className="h-3.5 w-3.5 text-gold" />
            <span>100% Certified Bhutan Organic · Carbon-Negative Nation</span>
          </div>

          <h1 className="font-display font-semibold text-primary leading-[0.95] tracking-[-0.03em] text-[clamp(2.8rem,7vw,6.5rem)]">
            Pure by <em className="not-italic text-gold font-normal italic">nature.</em>
            <br />
            Grown in <span className="relative inline-block">
              Bhutan.
              <svg className="absolute -bottom-2.5 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                <path d="M2 8 Q 60 2 100 6 T 198 5" stroke="var(--color-gold)" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-foreground/80 leading-relaxed font-light max-w-xl">
            Sourced directly from remote high-altitude Himalayan valleys: wild multi-flora honey, pure Shilajit resin, heritage red rice, and mountain wellness elixirs harvested by traditional farming families.
          </p>

          {/* Instant Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-lg rounded-full border border-border bg-card p-1.5 shadow-soft flex items-center gap-2">
            <div className="flex items-center gap-2.5 px-3.5 flex-1">
              <Search className="h-4 w-4 text-gold shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search wild honey, shilajit, red rice, pickles…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              type="submit"
              className="rounded-full bg-gradient-gold px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-soft hover:shadow-gold transition"
            >
              Search
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Popular:</span>
            {["Shilajit", "Wild Honey", "Cordyceps Tea", "Red Rice", "Dalle Pickle"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => navigate({ to: "/shop", search: { q: chip } as any })}
                className="rounded-full bg-secondary/80 border border-border px-2.5 py-0.5 hover:border-gold hover:text-gold transition text-[11px]"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 items-center">
            <Link to="/shop" className="btn-hero flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" /> Shop Complete Catalog
            </Link>
            <Link to="/story" className="btn-ghost-hero">Read Farmer Story</Link>
          </div>
        </div>

        <div className="lg:col-span-5 relative">
          <div className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-primary/10 shadow-[var(--shadow-hover)] border-2 border-border/80">
            <img
              src={heroProducts}
              alt="Curated Bhutanese agro products"
              width={1280}
              height={1280}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-primary/85 via-primary/30 to-transparent p-6 text-cream">
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold font-bold">Pristine Valley Reserve</span>
              <div className="font-display text-2xl font-bold mt-1">Highland Shilajit &amp; Wild Honey</div>
              <div className="text-xs text-cream/80 mt-0.5">Cold extracted &amp; 100% natural from Bumthang</div>
            </div>
          </div>

          {/* Floating Organic Seal */}
          <div className="absolute -top-4 -left-4 h-28 w-28 rounded-full bg-cream border-2 border-gold/60 grid place-items-center text-center shadow-[var(--shadow-soft)] rotate-[-6deg]">
            <div>
              <div className="text-gold font-display text-xl font-bold leading-none">Bhutan</div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-primary mt-1">Pure Organic</div>
            </div>
          </div>

          {/* Floating Review Badge */}
          <div className="hidden sm:block absolute -bottom-5 -right-3 max-w-[240px] bg-card border border-border rounded-2xl p-4 shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-1 text-gold mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5 fill-current" />
              ))}
            </div>
            <div className="text-xs font-bold text-foreground">Rated 4.9/5 by 800+ Families</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Verified Himalayan purity</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueStrip() {
  const items = [
    { icon: Sprout, title: "100% Authentic Origin", desc: "Sourced directly from native Bhutanese farming families" },
    { icon: Leaf, title: "Zero Chemicals & Additives", desc: "Pristine mountain soil, glacier water, zero pesticides" },
    { icon: ShieldCheck, title: "Fair Artisan Wages", desc: "Every purchase directly supports rural livelihoods" },
    { icon: Truck, title: "Secure Pan-Bhutan Shipping", desc: "Fast insured delivery to all 20 Dzongkhags" },
  ];

  return (
    <section className="container-page -mt-8 relative z-20">
      <div className="bg-card border border-border rounded-3xl shadow-[var(--shadow-soft)] grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 sm:p-7">
        {items.map((it) => (
          <div key={it.title} className="flex items-start gap-3.5">
            <div className="h-11 w-11 rounded-2xl bg-secondary grid place-items-center shrink-0 border border-border">
              <it.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">{it.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{it.desc}</div>
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
    <section className="container-page py-16 sm:py-20">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="eyebrow uppercase tracking-[0.2em] text-xs font-bold text-gold">Kingdom Catalog</span>
        <h2 className="font-display text-4xl sm:text-5xl mt-1 text-foreground font-semibold">Shop by Category</h2>
        <p className="text-muted-foreground text-sm mt-2">Discover curated Himalayan harvests grouped by ancient traditional categories</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 lg:gap-6 max-w-6xl mx-auto">
        {cats.map((c) => (
          <Link
            key={c.id}
            to="/category/$slug"
            params={{ slug: c.slug }}
            className="group flex flex-col items-center text-center transition-transform hover:-translate-y-1.5"
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-[#FAF6F0] p-1.5 border-2 border-[#E8E2D7] group-hover:border-gold group-hover:shadow-hover transition-all shadow-soft flex items-center justify-center">
              <img
                src={resolveCategoryAsset(c.slug, c.image_url)}
                alt={c.name}
                loading="lazy"
                className="h-full w-full object-cover rounded-full group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="mt-3.5 text-xs sm:text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
              {c.name}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function FestiveSpotlight() {
  return (
    <section className="container-page py-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-primary/95 to-slate-900 p-8 sm:p-12 text-primary-foreground shadow-deep border border-gold/30">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider mb-4 border border-gold/40">
            <Sparkles className="h-3.5 w-3.5" /> Tshechu Festive Harvest Celebration
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold leading-tight text-cream">
            Authentic. Natural. <br />
            <span className="text-gradient-gold">Deeply Meaningful.</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base text-cream/85 leading-relaxed">
            Stock up on seasonal Bumthang raw honey, glaciated Shilajit resin, and organic Lakadong turmeric. Sourced straight from certified cooperatives across the Kingdom.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              to="/shop"
              className="rounded-full bg-gradient-gold px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-gold hover:shadow-hover transition"
            >
              Shop Festive Harvest Offers
            </Link>
            <span className="text-xs text-cream/70">
              Enter code <strong className="text-gold font-mono text-sm">TSHECHU20</strong> at checkout
            </span>
          </div>
        </div>

        <div className="hidden lg:block absolute right-8 top-1/2 -translate-y-1/2 w-80 max-h-72 overflow-hidden rounded-2xl border-2 border-gold/40 shadow-hover">
          <img src={promoBanner} alt="Tshechu Festive Offers" className="w-full h-full object-cover" />
        </div>
      </div>
    </section>
  );
}

function CuratedShowcase() {
  const { data: products } = useSuspenseQuery(popularQuery());
  const [activeTab, setActiveTab] = useState<"all" | "honey" | "wellness" | "spices">("all");

  const filtered = useMemo(() => {
    const list = products as any[];
    if (activeTab === "honey") {
      return list.filter((p) => p.categories?.slug === "wild-honey" || p.name.toLowerCase().includes("honey"));
    }
    if (activeTab === "wellness") {
      return list.filter((p) => p.categories?.slug === "wellness" || p.name.toLowerCase().includes("shilajit") || p.name.toLowerCase().includes("capsule"));
    }
    if (activeTab === "spices") {
      return list.filter((p) => p.categories?.slug === "spices-condiments" || p.name.toLowerCase().includes("pickle") || p.name.toLowerCase().includes("turmeric"));
    }
    return list;
  }, [products, activeTab]);

  return (
    <section className="container-page py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <span className="eyebrow text-xs uppercase font-bold text-gold">Curated Harvest</span>
          <h2 className="font-display text-4xl sm:text-5xl mt-1 text-foreground font-semibold">Featured Treasures</h2>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "All Harvest" },
            { id: "honey", label: "Wild Honey" },
            { id: "wellness", label: "Wellness & Shilajit" },
            { id: "spices", label: "Spices & Pickles" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground border-primary shadow-soft"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filtered.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p as any} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 rounded-full border-2 border-primary text-primary px-8 py-3.5 text-sm font-bold hover:bg-primary hover:text-primary-foreground transition shadow-soft"
        >
          <span>Browse All {products.length} Products</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function FarmStory() {
  return (
    <section className="container-page py-16 sm:py-20">
      <div className="grid lg:grid-cols-2 gap-8 items-stretch">
        <div className="relative rounded-3xl overflow-hidden min-h-[480px] shadow-card border border-border">
          <img src={farmer} alt="Bhutanese farmer in pristine organic garden" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/75 to-primary/20" />
          <div className="absolute bottom-8 left-8 right-8 text-primary-foreground">
            <span className="eyebrow text-gold font-bold text-xs uppercase tracking-wider">Himalayan Heritage</span>
            <h3 className="font-display text-3xl sm:text-4xl mt-2 leading-tight drop-shadow-md font-bold">
              From Our High Valleys <br />to Your Family Table
            </h3>
            <p className="text-sm opacity-90 mt-3 max-w-sm leading-relaxed">
              We partner directly with family farms across Bumthang, Tsirang, and Punakha to preserve traditional, chemical-free agricultural wisdom.
            </p>
            <Link
              to="/story"
              className="inline-flex mt-6 items-center gap-2 bg-cream text-primary px-6 py-3 rounded-full text-xs font-bold hover:gap-3 transition-all shadow-lg"
            >
              <span>Our Sustainable Philosophy</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Carbon-Negative Soil",
              desc: "Grown in the world's premier carbon-negative sanctuary with 72% pristine forest cover.",
            },
            {
              title: "Glacial Snowmelt Purity",
              desc: "Highland crops naturally irrigated by fresh, mineral-dense Himalayan runoff.",
            },
            {
              title: "Fair Farmer Compensation",
              desc: "Every purchase directly strengthens rural cottage industries and master beekeepers.",
            },
            {
              title: "BAFRA Origin Verified",
              desc: "Rigorous quality oversight ensuring zero adulteration, chemical additives, or fillers.",
            },
          ].map((c) => (
            <div key={c.title} className="bg-secondary/60 border border-border rounded-3xl p-6 flex flex-col justify-between shadow-soft">
              <div>
                <div className="h-10 w-10 rounded-2xl bg-card grid place-items-center mb-4 border border-border">
                  <Leaf className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-display text-lg font-bold text-foreground">{c.title}</h4>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{c.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-border/60 text-[11px] font-semibold text-primary flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-gold" /> Certified Pure
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomerReviews() {
  const reviews = [
    {
      author: "Sonam D.",
      location: "Thimphu, Bhutan",
      product: "Pure Himalayan Bhutanese Shilajit Resin",
      text: "The energy and stamina difference is tangible. This is authentic resin with the genuine smoky aroma, far superior to imported brands.",
      rating: 5,
    },
    {
      author: "David M.",
      location: "London, United Kingdom",
      product: "Stingless-Bee Puthka Honey",
      text: "The citrusy, tangy flavor of this wild Puthka honey is unlike anything I've ever tasted. My throat felt immediate relief. Beautifully packaged.",
      rating: 5,
    },
    {
      author: "Tashi W.",
      location: "Paro, Bhutan",
      product: "Himalayan Cordyceps Herbal Tea",
      text: "Our family drinks this tea every evening. It provides wonderful warmth and deep sleep. Fast doorstep delivery to our home.",
      rating: 5,
    },
  ];

  return (
    <section className="bg-secondary/40 border-y border-border py-16">
      <div className="container-page">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="eyebrow text-xs uppercase font-bold text-gold">Verified Shoppers</span>
          <h2 className="font-display text-4xl sm:text-5xl mt-1 text-foreground font-semibold">Kind Words From Families</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {reviews.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-6 shadow-soft flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-gold mb-3">
                  {Array.from({ length: r.rating }).map((_, idx) => (
                    <Star key={idx} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed italic">
                  "{r.text}"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-foreground">{r.author}</div>
                  <div className="text-[11px] text-muted-foreground">{r.location}</div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold text-[10px]">
                  Verified Purchase
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HarvestClub() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setJoined(true);
      toast.success("Welcome to the Harvest Club! Your 10% welcome coupon code is WELCOME10.");
    }
  };

  return (
    <section className="container-page py-16">
      <div className="rounded-3xl bg-card border border-border p-8 sm:p-12 shadow-soft grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <span className="eyebrow text-xs uppercase font-bold text-gold">Seasonal Reserve Club</span>
          <h3 className="font-display text-3xl sm:text-4xl font-bold text-foreground mt-1">
            Join the Himalayan Harvest Circle
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
            Receive priority notifications for limited seasonal harvests: rare wild Cordyceps auctions, spring Puthka honey batches, and exclusive holiday gift sets.
          </p>
        </div>

        <div>
          {joined ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm font-medium text-center">
              🎉 Thank you for joining! Use code <strong>WELCOME10</strong> at checkout for 10% off your first order.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address…"
                className="flex-1 bg-background border border-border rounded-full px-5 py-3 text-sm outline-none focus:border-primary transition"
              />
              <button
                type="submit"
                className="btn-hero rounded-full whitespace-nowrap text-xs sm:text-sm font-bold"
              >
                Join Club &amp; Save 10%
              </button>
            </form>
          )}
          <div className="text-[11px] text-muted-foreground mt-2 text-center sm:text-left">
            Zero spam. Unsubscribe anytime with a single click.
          </div>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const items = [
    { title: "100% Authentic Bhutan", desc: "Certified Department of Agriculture origin" },
    { title: "RMA QR & Cash on Delivery", desc: "Safe, flexible payments across Bhutan" },
    { title: "Express Dispatch", desc: "Reliable shipping to all 20 Dzongkhags" },
    { title: "24/7 Dedicated Care", desc: "+975 17 97 00 50 via WhatsApp" },
  ];

  return (
    <section className="bg-primary text-primary-foreground py-10 border-t border-gold/20">
      <div className="container-page grid grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((it) => (
          <div key={it.title} className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-gold shrink-0" />
            <div>
              <div className="font-bold text-gold text-sm">{it.title}</div>
              <div className="text-xs opacity-80 mt-0.5">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
