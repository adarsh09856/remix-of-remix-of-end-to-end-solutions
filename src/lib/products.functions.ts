import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// ====================================================================
// AUTHENTIC TAKIN MART CATALOG (ORIGINAL LOVABLE APPLICATION DESIGN)
// "Himalayan Harvest — Authentic Bhutanese Goodness, Delivered"
// ====================================================================

export const FALLBACK_CATEGORIES = [
  {
    id: "cat-handicrafts-001",
    slug: "handicrafts",
    name: "Handicrafts",
    description: "Sacred textiles, turned burl woodcraft, and artisan metalwork certified by the Handicraft Association of Bhutan.",
    image_url: "/src/assets/c-gifts.jpg",
    sort_order: 1,
  },
  {
    id: "cat-organic-002",
    slug: "organic-products",
    name: "Organic Products",
    description: "Heritage grains, Paro red rice, black cardamom, and certified organic mountain harvests.",
    image_url: "/src/assets/c-grains.jpg",
    sort_order: 2,
  },
  {
    id: "cat-traditional-foods-003",
    slug: "traditional-foods",
    name: "Traditional Foods",
    description: "Authentic Bhutanese Momo Chutney, mountain timur pepper, sun-dried chili condiments, and buckwheat noodles.",
    image_url: "/src/assets/c-spices.jpg",
    sort_order: 3,
  },
  {
    id: "cat-wellness-004",
    slug: "wellness-herbal",
    name: "Wellness & Herbal Products",
    description: "Pure Himalayan raw wild honey, certified Lunana cordyceps sinensis, and high-altitude loose-leaf teas.",
    image_url: "/src/assets/c-wellness.jpg",
    sort_order: 4,
  },
  {
    id: "cat-gifts-005",
    slug: "gifts-souvenirs",
    name: "Gifts & Souvenirs",
    description: "Bumthang Yathra bags, hand-turned wooden Dappa bowls, thangkas, and consecrated miniature Buddhist statues.",
    image_url: "/src/assets/c-gifts.jpg",
    sort_order: 5,
  },
];

export const FALLBACK_PRODUCTS = [
  // 1. Bhutan Pure Wild Honey (500g Jar)
  {
    id: "prod-honey-001",
    slug: "bhutan-pure-wild-honey",
    name: "Bhutan Pure Wild Honey (500g Jar)",
    tagline: "Cold-extracted raw Himalayan cliff and wildflower honey",
    description: "Featured in our Tshechu harvest collection. Harvested from wild bees foraging in pristine alpine flora at 2,800m altitude in Bumthang. Unfiltered, unpasteurized, and rich in natural mountain propolis and enzymes.",
    category_id: "cat-wellness-004",
    categories: { slug: "wellness-herbal", name: "Wellness & Herbal Products" },
    artisan_name: "Bumthang Beekeepers Cooperative",
    region_of_origin: "Bumthang Valley, Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic by National Organic Programme of Bhutan",
    price_inr: 2200.00,
    price_usd: 26.00,
    price_aud: 40.00,
    price_eur: 24.00,
    price_gbp: 21.00,
    compare_at_inr: 2600.00,
    compare_at_usd: 31.00,
    stock: 45,
    unit: "500g jar",
    badge: "Tshechu Special",
    image_url: "/src/assets/p-honey.jpg",
    rating_avg: 4.9,
    rating_count: 84,
    featured: true,
  },
  // 2. Traditional Bhutanese Momo Chutney (350g Jar)
  {
    id: "prod-momo-chutney-002",
    slug: "traditional-bhutanese-momo-chutney",
    name: "Traditional Bhutanese Momo Chutney (350g Jar)",
    tagline: "Fiery Druk red chilies, roasted garlic, and Himalayan mountain spices",
    description: "The authentic taste of Bhutan's kitchens, as featured in our Tshechu harvest flyer. Slow-cooked with heritage dried red chilies, native mountain timur (Sichuan pepper), roasted garlic, and Himalayan rock salt. Pairs perfectly with steamed dumplings, roasted meats, or rice dishes.",
    category_id: "cat-traditional-foods-003",
    categories: { slug: "traditional-foods", name: "Traditional Foods" },
    artisan_name: "Thimphu Culinary Heritage Guild",
    region_of_origin: "Thimphu, Bhutan",
    association_certified: true,
    certification_seal: "Official Takin Mart Heritage Recipe",
    price_inr: 650.00,
    price_usd: 8.00,
    price_aud: 12.00,
    price_eur: 7.50,
    price_gbp: 6.50,
    compare_at_inr: 800.00,
    compare_at_usd: 10.00,
    stock: 60,
    unit: "350g jar",
    badge: "Best Seller",
    image_url: "/src/assets/p-chili-sauce.jpg",
    rating_avg: 5.0,
    rating_count: 112,
    featured: true,
  },
  // 3. Organic Bhutanese Red Rice (1kg Pouch)
  {
    id: "prod-red-rice-003",
    slug: "organic-red-rice-bhutan",
    name: "Organic Bhutanese Red Rice (1kg Pouch)",
    tagline: "Glacier-irrigated heritage whole grain from Paro Valley",
    description: "Shown prominently in our harvest flyer. Grown in mineral-dense soils fed by fresh snowmelt from Mt. Jomolhari. Semi-milled to leave behind the nutrient-rich red bran layer with high dietary fiber, iron, and a distinct nutty flavor.",
    category_id: "cat-organic-002",
    categories: { slug: "organic-products", name: "Organic Products" },
    artisan_name: "Paro Organic Farmers Cooperative",
    region_of_origin: "Paro Valley, Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic by National Organic Programme of Bhutan",
    price_inr: 750.00,
    price_usd: 9.00,
    price_aud: 14.00,
    price_eur: 8.50,
    price_gbp: 7.20,
    compare_at_inr: 900.00,
    compare_at_usd: 11.00,
    stock: 80,
    unit: "1kg pouch",
    badge: "100% Organic",
    image_url: "/src/assets/p-red-rice.jpg",
    rating_avg: 4.9,
    rating_count: 96,
    featured: true,
  },
  // 4. Organic Himalayan Black Cardamom (100g Pouch)
  {
    id: "prod-cardamom-004",
    slug: "organic-black-cardamom-bhutan",
    name: "Organic Himalayan Black Cardamom (100g Pouch)",
    tagline: "Sun-dried smoky pods hand-harvested in subtropical Tsirang",
    description: "Featured in our Tshechu harvest collection. Cultivated naturally under forest canopies in Tsirang and slowly wood-smoke dried over sweet hardwood embers. Imparts deep camphoraceous, woody complexity to traditional curries, stews, and warming herbal teas.",
    category_id: "cat-organic-002",
    categories: { slug: "organic-products", name: "Organic Products" },
    artisan_name: "Tsirang Organic Spice Growers",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "National Organic Certification Agency",
    price_inr: 540.00,
    price_usd: 6.50,
    price_aud: 10.00,
    price_eur: 6.00,
    price_gbp: 5.20,
    compare_at_inr: 650.00,
    compare_at_usd: 8.00,
    stock: 50,
    unit: "100g pouch",
    badge: "Aromatic Spice",
    image_url: "/src/assets/p-timur.jpg",
    rating_avg: 4.8,
    rating_count: 42,
    featured: true,
  },
  // 5. Bhutan High-Altitude Green Tea (100g Emerald Tin)
  {
    id: "prod-tea-005",
    slug: "bhutan-green-tea-tin",
    name: "Bhutan High-Altitude Green Tea (100g Emerald Tin)",
    tagline: "First-flush whole-leaf tea cultivated above the clouds in Trongsa",
    description: "Presented in the distinctive emerald gift tin shown on our flyer. Handpicked from heritage bushes in Samdrup Choling, Trongsa at 2,200m elevation. Gently steamed and pan-fired to yield a delicate, sweet vegetal cup rich in antioxidants.",
    category_id: "cat-wellness-004",
    categories: { slug: "wellness-herbal", name: "Wellness & Herbal Products" },
    artisan_name: "Samdrup Choling Women's Tea Cooperative",
    region_of_origin: "Trongsa, Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic by National Organic Programme of Bhutan",
    price_inr: 1200.00,
    price_usd: 15.00,
    price_aud: 23.00,
    price_eur: 14.00,
    price_gbp: 12.00,
    compare_at_inr: 1450.00,
    compare_at_usd: 18.00,
    stock: 70,
    unit: "100g tin",
    badge: "Emerald Tin",
    image_url: "/src/assets/p-green-tea.jpg",
    rating_avg: 4.9,
    rating_count: 67,
    featured: true,
  },
  // 6. Bumthang Yathra Handwoven Heritage Bag
  {
    id: "prod-yathra-bag-006",
    slug: "bumthang-yathra-handwoven-bag",
    name: "Bumthang Yathra Handwoven Heritage Bag",
    tagline: "Ancestral geometric wool textile woven on Bumthang pedal looms",
    description: "Shown on the left of our Tshechu harvest flyer. Crafted by master weavers in Chumey Valley from 100% pure Himalayan virgin wool, naturally dyed with walnut bark, indigo, and madder root. Finished with durable leather handles and brass fixtures.",
    category_id: "cat-handicrafts-001",
    categories: { slug: "handicrafts", name: "Handicrafts" },
    artisan_name: "Chumey Women Weavers Cooperative",
    region_of_origin: "Bumthang Valley, Bhutan",
    association_certified: true,
    certification_seal: "Certified Authentic by Handicraft Association of Bhutan",
    price_inr: 8500.00,
    price_usd: 98.00,
    price_aud: 155.00,
    price_eur: 92.00,
    price_gbp: 78.00,
    compare_at_inr: 9800.00,
    compare_at_usd: 115.00,
    stock: 18,
    unit: "bag",
    badge: "Handcrafted",
    image_url: "/src/assets/p-gift-hamper.jpg",
    rating_avg: 5.0,
    rating_count: 35,
    featured: true,
  },
  // 7. Turned Wooden Dappa Bowl & Cup Set
  {
    id: "prod-dappa-007",
    slug: "turned-wooden-dappa-bowl",
    name: "Turned Wooden Dappa Bowl & Cup Set",
    tagline: "Master Shagzo woodcraft turned from high-altitude maple burl",
    description: "Carved and hand-turned by traditional woodturners in Trashiyangtse. The airtight nesting lids fit with such precise friction that Bhutanese travelers historically used them to carry hot buttered food without leaking.",
    category_id: "cat-gifts-005",
    categories: { slug: "gifts-souvenirs", name: "Gifts & Souvenirs" },
    artisan_name: "Master Sangay Dorji (Trashiyangtse Guild)",
    region_of_origin: "Trashiyangtse, Bhutan",
    association_certified: true,
    certification_seal: "Certified Authentic by Handicraft Association of Bhutan",
    price_inr: 8800.00,
    price_usd: 105.00,
    price_aud: 165.00,
    price_eur: 98.00,
    price_gbp: 84.00,
    compare_at_inr: 10500.00,
    compare_at_usd: 125.00,
    stock: 22,
    unit: "set",
    badge: "Master Art",
    image_url: "/src/assets/p-gift-hamper.jpg",
    rating_avg: 4.8,
    rating_count: 29,
    featured: true,
  },
  // 8. Certified Genuine Wild Cordyceps Sinensis (Grade A - 10g)
  {
    id: "prod-cordyceps-008",
    slug: "certified-lunana-wild-cordyceps",
    name: "Certified Genuine Wild Cordyceps Sinensis (Grade A - 10g)",
    tagline: "Ethically gathered above 4,200m in Lunana with official government seal",
    description: "The crown jewel of Himalayan agro-wellness. Wild-harvested by nomadic yak herders in the alpine heights of Lunana. Graded, verified, and sealed by the Department of Forests & Park Services, Royal Government of Bhutan.",
    category_id: "cat-wellness-004",
    categories: { slug: "wellness-herbal", name: "Wellness & Herbal Products" },
    artisan_name: "Lunana Nomadic Gatherers Cooperative",
    region_of_origin: "Lunana, Gasa, Bhutan",
    association_certified: true,
    certification_seal: "Royal Government of Bhutan Official Export Seal",
    price_inr: 52000.00,
    price_usd: 595.00,
    price_aud: 920.00,
    price_eur: 550.00,
    price_gbp: 470.00,
    compare_at_inr: 60000.00,
    compare_at_usd: 690.00,
    stock: 12,
    unit: "10g tin",
    badge: "Rare Alpine",
    image_url: "/src/assets/p-cordyceps.jpg",
    rating_avg: 5.0,
    rating_count: 48,
    featured: true,
  },
  // 9. Himalayan Tartary Buckwheat Flour (1kg)
  {
    id: "prod-buckwheat-009",
    slug: "himalayan-buckwheat-flour",
    name: "Himalayan Tartary Buckwheat Flour (1kg)",
    tagline: "Stone-ground ancient grain from Bumthang Valley",
    description: "Nutrient-dense, low-GI whole grain flour stone-milled in Bumthang. High in rutin, plant-based protein, and fiber. Ideal for traditional Himalayan buckwheat noodles (Puta) and wholesome pancakes.",
    category_id: "cat-organic-002",
    categories: { slug: "organic-products", name: "Organic Products" },
    artisan_name: "Bumthang Milling Guild",
    region_of_origin: "Bumthang, Bhutan",
    association_certified: true,
    certification_seal: "Himalayan Heritage Grain",
    price_inr: 320.00,
    price_usd: 4.00,
    price_aud: 6.00,
    price_eur: 3.50,
    price_gbp: 3.20,
    compare_at_inr: 400.00,
    compare_at_usd: 5.00,
    stock: 75,
    unit: "1kg pouch",
    badge: "Organic",
    image_url: "/src/assets/p-buckwheat.jpg",
    rating_avg: 4.8,
    rating_count: 34,
    featured: false,
  },
  // 10. Highland Finger Millet (1kg)
  {
    id: "prod-millet-010",
    slug: "highland-finger-millet",
    name: "Highland Finger Millet (1kg)",
    tagline: "Traditional calcium-rich Himalayan supergrain",
    description: "Ancient heritage millet cultivated on terraced slopes in eastern Bhutan. Exceptionally high in calcium, iron, and dietary fiber. Naturally gluten-free and nutritious.",
    category_id: "cat-organic-002",
    categories: { slug: "organic-products", name: "Organic Products" },
    artisan_name: "Trashigang Organic Guild",
    region_of_origin: "Trashigang, Bhutan",
    association_certified: true,
    certification_seal: "Organic Bhutan Heritage",
    price_inr: 280.00,
    price_usd: 3.50,
    price_aud: 5.50,
    price_eur: 3.20,
    price_gbp: 2.80,
    compare_at_inr: 350.00,
    compare_at_usd: 4.50,
    stock: 60,
    unit: "1kg pouch",
    badge: "Supergrain",
    image_url: "/src/assets/p-millet.jpg",
    rating_avg: 4.7,
    rating_count: 22,
    featured: false,
  },
  // 11. Sun-Dried Forest Shiitake Mushrooms (150g)
  {
    id: "prod-shiitake-011",
    slug: "sun-dried-forest-shiitake",
    name: "Sun-Dried Forest Shiitake Mushrooms (150g)",
    tagline: "Wild-foraged forest oak shiitake from Bumthang",
    description: "Oak-log grown forest shiitake mushrooms harvested and sun-cured in alpine Bumthang. Deep earthy umami flavor, rich in beta-glucans for soups and braises.",
    category_id: "cat-organic-002",
    categories: { slug: "organic-products", name: "Organic Products" },
    artisan_name: "Bumthang Agro Foragers",
    region_of_origin: "Bumthang, Bhutan",
    association_certified: true,
    certification_seal: "Wild Himalayan Foraged Produce",
    price_inr: 650.00,
    price_usd: 8.00,
    price_aud: 12.00,
    price_eur: 7.50,
    price_gbp: 6.50,
    compare_at_inr: 780.00,
    compare_at_usd: 9.50,
    stock: 45,
    unit: "150g pack",
    badge: "Wild",
    image_url: "/src/assets/p-shiitake.jpg",
    rating_avg: 4.8,
    rating_count: 39,
    featured: false,
  },
  // 12. Cold-Pressed Bhutanese Mustard Oil (500ml)
  {
    id: "prod-mustard-oil-012",
    slug: "cold-pressed-mustard-oil",
    name: "Cold-Pressed Bhutanese Mustard Oil (500ml)",
    tagline: "Single-origin wood-pressed mustard oil with pungent aroma",
    description: "Traditional wood-pressed kachi-ghani mustard oil pressed from heritage seeds grown in Punakha Valley. High smoke point and authentic robust punch essential to Himalayan cooking.",
    category_id: "cat-traditional-foods-003",
    categories: { slug: "traditional-foods", name: "Traditional Foods" },
    artisan_name: "Punakha Oil Guild",
    region_of_origin: "Punakha, Bhutan",
    association_certified: true,
    certification_seal: "Pure Himalayan Cold Pressed",
    price_inr: 380.00,
    price_usd: 4.80,
    price_aud: 7.00,
    price_eur: 4.20,
    price_gbp: 3.80,
    compare_at_inr: 450.00,
    compare_at_usd: 5.50,
    stock: 55,
    unit: "500ml bottle",
    badge: "Cold-Pressed",
    image_url: "/src/assets/p-mustard-oil.jpg",
    rating_avg: 4.9,
    rating_count: 28,
    featured: false,
  },
  // 13. Traditional Suja Butter Tea Brick (250g)
  {
    id: "prod-suja-013",
    slug: "traditional-suja-butter-tea",
    name: "Traditional Suja Butter Tea Brick (250g)",
    tagline: "Fermented mountain tea brick for authentic Bhutanese butter tea",
    description: "Compressed fermented whole tea brick cured according to centuries-old Bhutanese monastery methods. Churned with yak butter and salt to create nourishing, warming Suja.",
    category_id: "cat-traditional-foods-003",
    categories: { slug: "traditional-foods", name: "Traditional Foods" },
    artisan_name: "Tongsa Tea Guild",
    region_of_origin: "Trongsa, Bhutan",
    association_certified: true,
    certification_seal: "Authentic Himalayan Recipe",
    price_inr: 450.00,
    price_usd: 5.50,
    price_aud: 8.50,
    price_eur: 5.00,
    price_gbp: 4.50,
    compare_at_inr: 550.00,
    compare_at_usd: 7.00,
    stock: 50,
    unit: "250g brick",
    badge: "Heritage",
    image_url: "/src/assets/p-suja.jpg",
    rating_avg: 4.8,
    rating_count: 31,
    featured: false,
  },
  // 14. Sun-Dried Organic Bhutanese Red Chilies (200g)
  {
    id: "prod-dried-chilies-014",
    slug: "sun-dried-organic-red-chilies",
    name: "Sun-Dried Organic Bhutanese Red Chilies (200g)",
    tagline: "Naturally roof-dried fiery chilies from Punakha",
    description: "Whole sun-dried red chilies cured on traditional farmhouse roofs across Punakha. The irreplaceable soul of Ema Datshi and Bhutanese culinary heritage.",
    category_id: "cat-traditional-foods-003",
    categories: { slug: "traditional-foods", name: "Traditional Foods" },
    artisan_name: "Punakha Valley Farmers",
    region_of_origin: "Punakha, Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic — Product of Bhutan",
    price_inr: 340.00,
    price_usd: 4.20,
    price_aud: 6.50,
    price_eur: 3.80,
    price_gbp: 3.40,
    compare_at_inr: 420.00,
    compare_at_usd: 5.20,
    stock: 65,
    unit: "200g pouch",
    badge: "Organic",
    image_url: "/src/assets/p-dried-chilies.jpg",
    rating_avg: 4.9,
    rating_count: 53,
    featured: false,
  },
];

function getPublicSupabase() {
  const env = typeof process !== "undefined" ? process.env : {};
  const url = import.meta.env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient<Database>(url, key, {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getPublicSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (!error && data && data.length > 0) {
        const authenticCatSlugs = new Set(FALLBACK_CATEGORIES.map((c) => c.slug));
        const hasLegacy = data.some((c: any) => !authenticCatSlugs.has(c.slug));
        if (!hasLegacy) return data;
      }
    } catch {
      // Fall through to fallback
    }
  }
  return FALLBACK_CATEGORIES;
});

const LEGACY_KEYWORDS = [
  "jinlab",
  "golden trio",
  "lakadong",
  "dalle dry fish",
  "dalle garlic",
  "beetroot capsules",
  "fire balls",
  "avocado jam",
  "chirata detox",
  "red kiwi",
  "black ginger",
  "shilajit resin",
  "sichuan",
  "botanical",
  "mushroom medley",
  "pure agro",
  "cordyceps tea capsules",
  "lemongrass",
  "dallae ray",
  "takin cordyceps honey",
  "takin botanical",
  "dalle chilli paste pickle",
  "takin bhutanese green",
  "chirata herbal capsules",
  "organics black turmeric",
  "wild mountain honey",
  "kingless",
  "takin chitwan",
  "traditional bhutanese dho",
];

async function syncAuthenticCatalog(supabase: any) {
  try {
    const authenticSlugs = new Set(FALLBACK_PRODUCTS.map((p) => p.slug));

    // 1. Remove all Jinlab products and legacy mock products
    for (const kw of LEGACY_KEYWORDS) {
      await supabase.from("products").delete().ilike("name", `%${kw}%`);
      await supabase.from("products").delete().ilike("slug", `%${kw}%`);
    }

    // 2. Remove any product whose slug is not in the authentic list
    const { data: allRows } = await supabase.from("products").select("id, slug");
    if (allRows && allRows.length > 0) {
      for (const row of allRows) {
        if (!authenticSlugs.has(row.slug)) {
          await supabase.from("products").delete().eq("id", row.id);
        }
      }
    }

    // 3. Remove non-authentic categories
    const authenticCatSlugs = new Set(FALLBACK_CATEGORIES.map((c) => c.slug));
    const { data: allCats } = await supabase.from("categories").select("id, slug");
    if (allCats && allCats.length > 0) {
      for (const cat of allCats) {
        if (!authenticCatSlugs.has(cat.slug)) {
          await supabase.from("categories").delete().eq("id", cat.id);
        }
      }
    }

    // 4. Upsert authentic 5 categories
    for (const cat of FALLBACK_CATEGORIES) {
      await supabase.from("categories").upsert(
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image_url: cat.image_url,
          sort_order: cat.sort_order,
        },
        { onConflict: "slug" }
      );
    }

    const { data: dbCats } = await supabase.from("categories").select("id, slug");
    const catMap = new Map((dbCats || []).map((c: any) => [c.slug, c.id]));

    // 5. Upsert authentic products
    for (const p of FALLBACK_PRODUCTS) {
      const catSlug = p.categories?.slug || "wellness-herbal";
      const catId = catMap.get(catSlug) || null;
      await supabase.from("products").upsert(
        {
          name: p.name,
          slug: p.slug,
          tagline: p.tagline,
          description: p.description,
          price_inr: p.price_inr,
          compare_at_inr: p.compare_at_inr,
          unit: p.unit,
          image_url: p.image_url,
          badge: p.badge,
          stock: p.stock ?? 50,
          origin: p.region_of_origin || "Bhutan",
          category_id: catId,
          is_active: true,
        },
        { onConflict: "slug" }
      );
    }
  } catch (e) {
    console.error("[CatalogSync Error]", e);
  }
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((d: { categorySlug?: string; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    if (supabase) {
      try {
        let q = supabase
          .from("products")
          .select("*, categories(slug, name)")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (data.categorySlug) {
          const { data: cat } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", data.categorySlug)
            .maybeSingle();
          if (cat) q = q.eq("category_id", cat.id);
        }
        if (data.limit) q = q.limit(data.limit);
        const { data: rows, error } = await q;
        if (!error && rows && rows.length > 0) {
          const authenticSlugs = new Set(FALLBACK_PRODUCTS.map((p) => p.slug));
          const hasLegacy = rows.some((r: any) => {
            if (!authenticSlugs.has(r.slug)) return true;
            const lowerName = (r.name || "").toLowerCase();
            return LEGACY_KEYWORDS.some((kw) => lowerName.includes(kw));
          });

          if (!hasLegacy) {
            return rows;
          }

          // Trigger automatic database cleanup & sync in background
          syncAuthenticCatalog(supabase).catch(() => {});
        }
      } catch {
        // Fall through to fallback
      }
    }

    // Return fallback catalog
    let list = [...FALLBACK_PRODUCTS];
    if (data.categorySlug) {
      list = list.filter((p) => p.categories?.slug === data.categorySlug);
    }
    if (data.limit) {
      list = list.slice(0, data.limit);
    }
    return list;
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    if (supabase) {
      try {
        const { data: product, error } = await supabase
          .from("products")
          .select("*, categories(slug, name)")
          .eq("slug", data.slug)
          .eq("is_active", true)
          .maybeSingle();
        if (!error && product && !product.name.includes("Sichuan") && !product.slug.startsWith("jinlab-")) {
          return product;
        }
      } catch {
        // Fall through
      }
    }
    return FALLBACK_PRODUCTS.find((p) => p.slug === data.slug) ?? null;
  });

export const getCategoryBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const supabase = getPublicSupabase();
    if (supabase) {
      try {
        const { data: cat, error } = await supabase
          .from("categories")
          .select("*")
          .eq("slug", data.slug)
          .maybeSingle();
        if (!error && cat) {
          const { data: products } = await supabase
            .from("products")
            .select("*")
            .eq("category_id", cat.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false });
          return { category: cat, products: products ?? [] };
        }
      } catch {
        // Fall through
      }
    }

    const cat = FALLBACK_CATEGORIES.find((c) => c.slug === data.slug) ?? null;
    if (!cat) return null;
    const products = FALLBACK_PRODUCTS.filter((p) => p.categories?.slug === data.slug);
    return { category: cat, products };
  });
