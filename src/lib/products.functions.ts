import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

// ====================================================================
// AUTHENTIC TAKIN MART CATALOG (MATCHING THE TSHECHU OFFERS BANNER)
// "Himalayan Harvest — Tshechu Offers — Authentic. Natural. Meaningful."
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
  {
    id: "prod-cardamom-004",
    slug: "organic-black-cardamom-bhutan",
    name: "Organic Himalayan Black Cardamom (200g Pouch)",
    tagline: "Sun-dried smoky pods hand-harvested in subtropical Tsirang",
    description: "Featured in our Tshechu harvest collection. Cultivated naturally under forest canopies in Tsirang and slowly wood-smoke dried over sweet hardwood embers. Imparts deep camphoraceous, woody complexity to traditional curries, stews, and warming herbal teas.",
    category_id: "cat-organic-002",
    categories: { slug: "organic-products", name: "Organic Products" },
    artisan_name: "Tsirang Organic Spice Growers",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "National Organic Certification Agency",
    price_inr: 950.00,
    price_usd: 11.50,
    price_aud: 18.00,
    price_eur: 10.50,
    price_gbp: 9.00,
    compare_at_inr: 1150.00,
    compare_at_usd: 14.00,
    stock: 50,
    unit: "200g pouch",
    badge: "Aromatic Spice",
    image_url: "/src/assets/p-timur.jpg",
    rating_avg: 4.8,
    rating_count: 42,
    featured: true,
  },
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
    price_inr: 6800.00,
    price_usd: 80.00,
    price_aud: 125.00,
    price_eur: 75.00,
    price_gbp: 64.00,
    compare_at_inr: 7900.00,
    compare_at_usd: 95.00,
    stock: 22,
    unit: "set",
    badge: "Shagzo Art",
    image_url: "/src/assets/p-gift-hamper.jpg",
    rating_avg: 4.8,
    rating_count: 29,
    featured: true,
  },
  {
    id: "prod-cordyceps-008",
    slug: "certified-lunana-wild-cordyceps",
    name: "Certified Lunana Wild Cordyceps Sinensis (Grade A - 10g)",
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
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall through to fallback
    }
  }
  return FALLBACK_CATEGORIES;
});

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
        if (!error && rows && rows.length > 0) return rows;
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
        if (!error && product) return product;
      } catch {
        // Fall through to fallback
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
        // Fall through to fallback
      }
    }

    const cat = FALLBACK_CATEGORIES.find((c) => c.slug === data.slug) ?? null;
    if (!cat) return null;
    const products = FALLBACK_PRODUCTS.filter((p) => p.categories?.slug === data.slug);
    return { category: cat, products };
  });
