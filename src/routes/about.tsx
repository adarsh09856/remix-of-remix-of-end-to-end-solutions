import { createFileRoute, Link } from "@tanstack/react-router";
import landscape from "@/assets/bhutan-landscape.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Bhutan — Takin Mart" },
      { name: "description", content: "Discover Bhutan — the last Himalayan kingdom, home to pristine forests, fertile valleys, and the world's only carbon-negative country." },
      { property: "og:title", content: "About Bhutan — Takin Mart" },
      { property: "og:description", content: "The last Himalayan kingdom and the source of every Takin Mart product." },
      { property: "og:image", content: "" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="relative h-96">
        <img src={landscape} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/30" />
        <div className="relative container-page h-full flex flex-col justify-end pb-12 text-primary-foreground">
          <span className="eyebrow" style={{ color: "var(--gold)" }}>About</span>
          <h1 className="font-display text-5xl md:text-6xl mt-2 max-w-2xl">The Land of the Thunder Dragon</h1>
        </div>
      </section>

      <article className="container-page py-16 max-w-3xl prose-styles">
        <p className="text-xl text-foreground/80 leading-relaxed font-display">
          Tucked between the giants of India and Tibet, Bhutan is a kingdom that measures success in Gross National Happiness — and protects its forests, rivers, and farms with the same care it gives its monasteries.
        </p>
        <div className="mt-10 space-y-8 text-foreground/85 leading-relaxed">
          <p>
            More than 70% of Bhutan remains forested, by constitutional mandate. The country is carbon-negative, growing more clean air than it consumes. Its valleys, terraced for centuries, still produce some of the purest food in the Himalayas — red rice from Paro, buckwheat from Bumthang, wild cliff honey from the eastern highlands.
          </p>
          <p>
            Bhutan adopted organic-by-default farming as national policy. There are no industrial chemicals on the land. Every grain, every drop of honey, every chili you taste from Takin Mart is shaped by altitude, by glacier-fed water, and by farmers whose families have tended these fields for generations.
          </p>
          <h2 className="font-display text-3xl text-primary mt-12">Why It Matters</h2>
          <p>
            When you buy from Takin Mart, you support a way of farming that the rest of the world is just learning to value again — slow, traditional, and in harmony with the mountains.
          </p>
        </div>
        <div className="mt-12 flex gap-3">
          <Link to="/shop" className="btn-hero">Explore products</Link>
          <Link to="/story" className="btn-ghost-hero">Our story</Link>
        </div>
      </article>
    </div>
  );
}
