import { createFileRoute, Link } from "@tanstack/react-router";
import farmer from "@/assets/farmer.jpg";

export const Route = createFileRoute("/story")({
  head: () => ({
    meta: [
      { title: "Our Story — Takin Mart" },
      { name: "description", content: "Takin Mart connects Bhutanese farmers with families across Bhutan — every product is sourced, tested and packed with care." },
      { property: "og:title", content: "Our Story — Takin Mart" },
      { property: "og:description", content: "From a single basket of red rice to a movement for fair, traditional, Himalayan food." },
    ],
  }),
  component: StoryPage,
});

function StoryPage() {
  return (
    <div className="container-page py-16 max-w-4xl">
      <div className="text-center">
        <span className="eyebrow">Our Story</span>
        <h1 className="font-display text-5xl md:text-6xl mt-2">From Our Farms to Your Family</h1>
      </div>

      <div className="mt-12 grid md:grid-cols-2 gap-10 items-center">
        <img src={farmer} alt="Bhutanese farmer with tea leaves" className="rounded-3xl" />
        <div className="space-y-5 text-foreground/85 leading-relaxed">
          <p>
            Takin Mart began with a single basket of red rice carried down from the Paro Valley. We saw a small farming community whose produce was extraordinary — but whose reach barely extended past the next village.
          </p>
          <p>
            Today we work with farming cooperatives across Bhutan to bring their wildflower honey, hand-blended spices, and high-grown teas to homes across Bhutan — with fair pricing, traceable origins, and zero compromise on what makes the food special in the first place.
          </p>
        </div>
      </div>

      <div className="mt-20 grid md:grid-cols-3 gap-6">
        {[
          { n: "01", t: "Source", d: "We work directly with farmer cooperatives across Bhutan's valleys and highlands." },
          { n: "02", t: "Test & Pack", d: "Every batch is hand-checked for quality, then sealed in protective packaging." },
          { n: "03", t: "Deliver", d: "Shipped securely across Bhutan with care and full traceability." },
        ].map((s) => (
          <div key={s.n} className="bg-card border border-border rounded-2xl p-6">
            <div className="font-display text-4xl text-gold">{s.n}</div>
            <h3 className="font-display text-xl mt-3">{s.t}</h3>
            <p className="text-sm text-muted-foreground mt-2">{s.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Link to="/shop" className="btn-hero">Shop the harvest</Link>
      </div>
    </div>
  );
}
