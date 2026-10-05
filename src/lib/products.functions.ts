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
    id: "cat-grains-001",
    slug: "grains-cereals",
    name: "Grains & Cereals",
    description: "Heritage Bhutanese red rice, tartary buckwheat, and high-altitude mountain grains grown sustainably.",
    image_url: "/src/assets/c-grains.jpg",
    sort_order: 1,
  },
  {
    id: "cat-honey-002",
    slug: "wild-honey",
    name: "Wild Honey",
    description: "Raw, unprocessed multi-flora, cordyceps, and stingless-bee Puthka honey from Bhutan's pristine forests.",
    image_url: "/src/assets/c-honey.jpg",
    sort_order: 2,
  },
  {
    id: "cat-spices-003",
    slug: "spices-condiments",
    name: "Spices & Condiments",
    description: "High-curcumin Lakadong turmeric, fiery Dalle chillies, mountain ghee, and traditional handmade pickles.",
    image_url: "/src/assets/c-spices.jpg",
    sort_order: 3,
  },
  {
    id: "cat-dried-004",
    slug: "dried-foods",
    name: "Dried Foods",
    description: "Artisanal avocado and kiwi jams, sun-dried wild shiitake mushrooms, and mountain fruits.",
    image_url: "/src/assets/c-dried.jpg",
    sort_order: 4,
  },
  {
    id: "cat-tea-005",
    slug: "tea-beverages",
    name: "Tea & Beverages",
    description: "High-grown organic green teas, cordyceps herbal infusions, and traditional Himalayan teas.",
    image_url: "/src/assets/c-tea.jpg",
    sort_order: 5,
  },
  {
    id: "cat-wellness-006",
    slug: "wellness",
    name: "Wellness",
    description: "Pure Himalayan shilajit, organic black turmeric, chirata, beetroot, and vitality herbal supplements.",
    image_url: "/src/assets/c-wellness.jpg",
    sort_order: 6,
  },
  {
    id: "cat-gifts-007",
    slug: "gift-hampers",
    name: "Gift Hampers",
    description: "Curated gift collections of authentic Bhutanese agro and wellness treasures for discerning recipients.",
    image_url: "/src/assets/c-gifts.jpg",
    sort_order: 7,
  },
];

export const FALLBACK_PRODUCTS = [
  // 1. Golden Trio Capsules
  {
    id: "prod-golden-trio-001",
    slug: "jinlab-golden-trio-capsules",
    name: "Golden Trio Capsules",
    tagline: "Turmeric · Ginger · Black Pepper blend",
    description: "Synergistic botanical blend of organic Lakadong turmeric, highland ginger, and black pepper. Formulated to enhance bioavailability and provide daily anti-inflammatory and antioxidant support. Grown in carbon-negative Bhutan.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Bhutan Organic & Pure Agro Seal",
    price_inr: 2100.00,
    price_usd: 25.00,
    price_aud: 38.00,
    price_eur: 23.00,
    price_gbp: 20.00,
    stock: 45,
    unit: "60 capsules",
    badge: "New",
    image_url: "/products/golden-trio-capsules-poster.png",
    rating_avg: 5.0,
    rating_count: 32,
    featured: true,
  },
  // 2. Organic Lakadong Turmeric Powder
  {
    id: "prod-lakadong-turmeric-002",
    slug: "jinlab-lakadong-turmeric-powder",
    name: "Organic Lakadong Turmeric Powder",
    tagline: "High curcumin content 7–9% · Certified organic",
    description: "Pure, high-potency Lakadong turmeric powder cultivated organically in the mineral-rich soils of Bhutan. Renowned for its exceptionally high curcumin content (7–9%) and vibrant golden color.",
    category_id: "cat-spices-003",
    categories: { slug: "spices-condiments", name: "Spices & Condiments" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic — Product of Bhutan",
    price_inr: 399.00,
    price_usd: 5.00,
    price_aud: 7.50,
    price_eur: 4.50,
    price_gbp: 4.00,
    stock: 60,
    unit: "250g jar",
    badge: "New",
    image_url: "/products/lakadong-turmeric-powder-poster.png",
    rating_avg: 4.9,
    rating_count: 58,
    featured: true,
  },
  // 3. Traditional Bhutan Ghee
  {
    id: "prod-bhutan-ghee-003",
    slug: "jinlab-bhutan-ghee",
    name: "Traditional Bhutan Ghee",
    tagline: "Pure Himalayan ghee · Rich in A2 Beta-Casein",
    description: "Hand-churned Himalayan butter rendered into aromatic, golden ghee using age-old Bhutanese dairy traditions. Naturally rich in A2 beta-casein, essential fat-soluble vitamins, and healthy omega fatty acids.",
    category_id: "cat-spices-003",
    categories: { slug: "spices-condiments", name: "Spices & Condiments" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Pure Himalayan Dairy — Product of Bhutan",
    price_inr: 1650.00,
    price_usd: 20.00,
    price_aud: 30.00,
    price_eur: 18.00,
    price_gbp: 16.00,
    stock: 35,
    unit: "500g jar",
    badge: "New",
    image_url: "/products/bhutan-ghee-poster.png",
    rating_avg: 4.9,
    rating_count: 44,
    featured: true,
  },
  // 4. Dalle Dry Fish Pickle
  {
    id: "prod-dalle-dry-fish-004",
    slug: "jinlab-dalle-dry-fish-pickle",
    name: "Dalle Dry Fish Pickle",
    tagline: "A timeless Bhutanese favourite",
    description: "Authentic Bhutanese artisan pickle combining fiery round Dalle chillies with traditionally cured dry fish, cold-pressed mustard oil, and mountain spices. Robust and savory.",
    category_id: "cat-spices-003",
    categories: { slug: "spices-condiments", name: "Spices & Condiments" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Authentic Bhutanese Recipe",
    price_inr: 480.00,
    price_usd: 6.00,
    price_aud: 9.00,
    price_eur: 5.50,
    price_gbp: 4.80,
    stock: 40,
    unit: "200 g",
    badge: null,
    image_url: "/products/jinlab-dalle-dry-fish-pickle.png",
    rating_avg: 4.8,
    rating_count: 36,
    featured: true,
  },
  // 5. Jinlab Cordyceps Honey
  {
    id: "prod-cordyceps-honey-005",
    slug: "jinlab-cordyceps-honey",
    name: "Jinlab Cordyceps Honey",
    tagline: "Pure natural premium honey with cordyceps",
    description: "Raw Himalayan wildflower honey masterfully infused with authentic high-altitude Cordyceps Sinensis. An exquisite vitality tonic supporting immunity, stamina, and respiratory health.",
    category_id: "cat-honey-002",
    categories: { slug: "wild-honey", name: "Wild Honey" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bumthang / Lunana, Bhutan",
    association_certified: true,
    certification_seal: "Himalayan Cordyceps & Wild Honey Seal",
    price_inr: 1490.00,
    price_usd: 18.00,
    price_aud: 27.00,
    price_eur: 16.50,
    price_gbp: 14.50,
    stock: 25,
    unit: "250 g",
    badge: "Premium",
    image_url: "/products/jinlab-cordyceps-honey.png",
    rating_avg: 5.0,
    rating_count: 51,
    featured: true,
  },
  // 6. Himalayan Cordyceps Herbal Tea
  {
    id: "prod-cordyceps-tea-006",
    slug: "jinlab-himalayan-cordyceps-herbal-tea",
    name: "Himalayan Cordyceps Herbal Tea",
    tagline: "Premium herbs, sustainably sourced",
    description: "A restorative herbal infusion blending wild Cordyceps Sinensis with Bhutanese highland herbs. Naturally caffeine-free, offering a soothing, earthy finish. Packed in 20 sachets.",
    category_id: "cat-tea-005",
    categories: { slug: "tea-beverages", name: "Tea & Beverages" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Sustainably Harvested Himalayan Herbs",
    price_inr: 890.00,
    price_usd: 11.00,
    price_aud: 16.00,
    price_eur: 10.00,
    price_gbp: 8.80,
    stock: 50,
    unit: "30 g",
    badge: "New",
    image_url: "/products/jinlab-cordyceps-tea-front.png",
    images: ["/products/jinlab-cordyceps-tea-front.png", "/products/jinlab-cordyceps-tea-side.png", "/products/jinlab-cordyceps-tea-back.png"],
    rating_avg: 4.9,
    rating_count: 40,
    featured: true,
  },
  // 7. Dalle Garlic Pickle
  {
    id: "prod-dalle-garlic-007",
    slug: "jinlab-dalle-garlic-pickle",
    name: "Dalle Garlic Pickle",
    tagline: "A timeless Bhutanese favourite",
    description: "Whole garlic cloves pickled with native Dalle cherry chillies in mustard oil and Himalayan aromatic seeds. A quintessential accompaniment to red rice and hearty stews.",
    category_id: "cat-spices-003",
    categories: { slug: "spices-condiments", name: "Spices & Condiments" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Traditional Recipe — No Chemical Additives",
    price_inr: 350.00,
    price_usd: 4.50,
    price_aud: 6.50,
    price_eur: 4.00,
    price_gbp: 3.50,
    stock: 55,
    unit: "200 g",
    badge: null,
    image_url: "/products/jinlab-dalle-garlic-pickle.png",
    rating_avg: 4.7,
    rating_count: 28,
    featured: true,
  },
  // 8. Jinlab Beetroot Capsules
  {
    id: "prod-beetroot-008",
    slug: "jinlab-beetroot-capsules",
    name: "Jinlab Beetroot Capsules",
    tagline: "Natural energy and vitality support",
    description: "Pure organic Bhutanese beetroot dehydrated at low temperatures and encapsulated. Rich in natural dietary nitrates, iron, and antioxidants to support endurance and healthy blood flow.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "100% Pure Beetroot — No Additives",
    price_inr: 790.00,
    price_usd: 10.00,
    price_aud: 14.50,
    price_eur: 9.00,
    price_gbp: 8.00,
    stock: 45,
    unit: "60 caps",
    badge: "New",
    image_url: "/products/jinlab-beetroot-capsules-front.png",
    images: ["/products/jinlab-beetroot-capsules-front.png", "/products/jinlab-beetroot-capsules-nutrition.png"],
    rating_avg: 4.9,
    rating_count: 31,
    featured: true,
  },
  // 9. Fire Balls Dalle Paste Pickle
  {
    id: "prod-fire-balls-009",
    slug: "jinlab-fire-balls-dalle-paste-pickle",
    name: "Fire Balls Dalle Paste Pickle",
    tagline: "Hot spicy cherry pepper paste",
    description: "Crushed fiery Dalle cherry peppers slow-cooked into an intense spicy paste with Himalayan spices. The ultimate condiment for heat-lovers, momos, and traditional noodle soups.",
    category_id: "cat-spices-003",
    categories: { slug: "spices-condiments", name: "Spices & Condiments" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Fiery Mountain Chili Product",
    price_inr: 450.00,
    price_usd: 5.50,
    price_aud: 8.50,
    price_eur: 5.00,
    price_gbp: 4.50,
    stock: 35,
    unit: "200 g",
    badge: "Hot",
    image_url: "/products/jinlab-fire-balls-dalle-paste-pickle.png",
    rating_avg: 4.8,
    rating_count: 45,
    featured: true,
  },
  // 10. Jinlab Avocado Jam
  {
    id: "prod-avocado-jam-010",
    slug: "jinlab-avocado-jam",
    name: "Jinlab Avocado Jam",
    tagline: "60% pure Bhutanese avocados · Artisanal fruit spread",
    description: "Artisanal, nutrient-dense fruit spread crafted from 60% fresh subtropical avocados grown organically in Tsirang, Bhutan. Mildly sweet, smooth, and delicious on sourdough toast.",
    category_id: "cat-dried-004",
    categories: { slug: "dried-foods", name: "Dried Foods" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Artisanal Homemade Product of Bhutan",
    price_inr: 2500.00,
    price_usd: 30.00,
    price_aud: 45.00,
    price_eur: 28.00,
    price_gbp: 24.50,
    stock: 30,
    unit: "220 g",
    badge: null,
    image_url: "/products/avocado-jam-poster.png",
    images: ["/products/avocado-jam-poster.png", "/products/jinlab-avocado-jam.png"],
    rating_avg: 4.9,
    rating_count: 22,
    featured: true,
  },
  // 11. Chirata Detox Capsules
  {
    id: "prod-chirata-detox-011",
    slug: "jinlab-chirata-detox-capsules",
    name: "Chirata Detox Capsules",
    tagline: "The extra from the Himalayas",
    description: "High-potency Swertia Chirayita extract encapsulated for convenient daily detox. Revered in traditional Sowa Rigpa medicine for liver cleansing, bile stimulation, and immune support.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Himalayan Detox Herb Extract",
    price_inr: 990.00,
    price_usd: 12.00,
    price_aud: 18.00,
    price_eur: 11.00,
    price_gbp: 9.80,
    stock: 40,
    unit: "60 caps",
    badge: "Premium",
    image_url: "/products/jinlab-chirata-detox-capsules.png",
    rating_avg: 4.8,
    rating_count: 37,
    featured: true,
  },
  // 12. Organic Turmeric Capsules
  {
    id: "prod-turmeric-caps-012",
    slug: "jinlab-organic-turmeric-capsules",
    name: "Organic Turmeric Capsules",
    tagline: "Curcuma Longa — pure Bhutanese turmeric",
    description: "Pure single-origin Curcuma Longa grown in the pristine valleys of Bhutan. 100% plant-based pullulan capsules designed for joint flexibility, radiant skin, and gut health.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic Curcuma Longa",
    price_inr: 720.00,
    price_usd: 9.00,
    price_aud: 13.00,
    price_eur: 8.00,
    price_gbp: 7.00,
    stock: 60,
    unit: "60 caps",
    badge: "Organic",
    image_url: "/products/jinlab-organic-turmeric-capsules.png",
    rating_avg: 4.9,
    rating_count: 53,
    featured: true,
  },
  // 13. Natural Red Kiwi Jam
  {
    id: "prod-kiwi-jam-013",
    slug: "jinlab-natural-red-kiwi-jam",
    name: "Natural Red Kiwi Jam",
    tagline: "Homemade red kiwi jam from Bhutan",
    description: "Small-batch preserve made from rare red-fleshed kiwis grown in southern Bhutan. Naturally rich in vitamin C and polyphenols with an exquisite berry-like tang.",
    category_id: "cat-dried-004",
    categories: { slug: "dried-foods", name: "Dried Foods" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Homemade Bhutan Fruit Preserve",
    price_inr: 560.00,
    price_usd: 7.00,
    price_aud: 10.50,
    price_eur: 6.50,
    price_gbp: 5.60,
    stock: 40,
    unit: "220 g",
    badge: null,
    image_url: "/products/jinlab-natural-red-kiwi-jam.png",
    rating_avg: 4.8,
    rating_count: 19,
    featured: true,
  },
  // 14. Organic Black Turmeric Capsules
  {
    id: "prod-black-turmeric-014",
    slug: "jinlab-organic-black-turmeric-capsules",
    name: "Organic Black Turmeric Capsules",
    tagline: "Cucurma Caesia — the rare black turmeric",
    description: "The rarest Himalayan rhizome — Cucurma Caesia with its dark bluish-black interior. Prized for its intense anti-inflammatory properties, respiratory support, and high antioxidant levels.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Rare Himalayan Curcuma Caesia",
    price_inr: 1290.00,
    price_usd: 15.50,
    price_aud: 23.50,
    price_eur: 14.50,
    price_gbp: 12.80,
    stock: 30,
    unit: "60 caps",
    badge: "Rare",
    image_url: "/products/jinlab-organic-black-turmeric-capsules.png",
    rating_avg: 5.0,
    rating_count: 24,
    featured: true,
  },
  // 15. Premium Multi Flora Honey
  {
    id: "prod-multi-flora-015",
    slug: "jinlab-premium-multi-flora-honey",
    name: "Premium Multi Flora Honey",
    tagline: "Pure, raw and unfiltered — native Apis cerana bees",
    description: "Raw, unprocessed mountain honey gathered by native Apis cerana bees foraging on wildflowers in the high-altitude forests of Bumthang. Unfiltered, enzyme-rich, and pure.",
    category_id: "cat-honey-002",
    categories: { slug: "wild-honey", name: "Wild Honey" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bumthang Valley, Bhutan",
    association_certified: true,
    certification_seal: "Pure Himalayan Highland Honey",
    price_inr: 850.00,
    price_usd: 10.50,
    price_aud: 15.50,
    price_eur: 9.50,
    price_gbp: 8.50,
    stock: 65,
    unit: "250g jar",
    badge: "Bestseller",
    image_url: "/products/multi-flora-honey-poster.png",
    images: ["/products/multi-flora-honey-poster.png", "/products/multi-flora-honey-specs.png", "/products/jinlab-premium-multi-flora-honey.png"],
    rating_avg: 5.0,
    rating_count: 67,
    featured: true,
  },
  // 16. Pure Himalayan Bhutanese Shilajit
  {
    id: "prod-shilajit-016",
    slug: "jinlab-bhutanese-shilajit",
    name: "Pure Himalayan Bhutanese Shilajit",
    tagline: "Rich in fulvic & humic acids · High-altitude sourced",
    description: "Pure grade-A Himalayan Shilajit resin harvested at over 4,500m elevation. Purified using traditional herbal decoctions, containing over 85 trace minerals and 70%+ fulvic acid.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "High Himalayas, Bhutan",
    association_certified: true,
    certification_seal: "Authentic Himalayan Shilajit Resin",
    price_inr: 1700.00,
    price_usd: 21.00,
    price_aud: 31.00,
    price_eur: 19.00,
    price_gbp: 16.80,
    stock: 35,
    unit: "20 g",
    badge: "Premium",
    image_url: "/products/bhutanese-shilajit-poster.png",
    images: ["/products/bhutanese-shilajit-poster.png", "/products/jinlab-bhutanese-shilajit.png"],
    rating_avg: 4.9,
    rating_count: 49,
    featured: true,
  },
  // 17. Stingless-Bee Puthka Honey
  {
    id: "prod-puthka-honey-017",
    slug: "jinlab-stingless-bee-puthka-honey",
    name: "Stingless-Bee Puthka Honey",
    tagline: "Rare Puthka Honey · High-altitude, antioxidant-rich",
    description: "The legendary Puthka honey from Bhutan's stingless Meliponini bees. Tangy, slightly citrusy, and renowned for extraordinary antimicrobial and tissue healing properties.",
    category_id: "cat-honey-002",
    categories: { slug: "wild-honey", name: "Wild Honey" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Ultra-Rare Puthka Wild Honey",
    price_inr: 2500.00,
    price_usd: 30.00,
    price_aud: 45.00,
    price_eur: 28.00,
    price_gbp: 24.50,
    stock: 20,
    unit: "100 ml",
    badge: "Rare",
    image_url: "/products/stingless-bee-puthka-honey-poster.png",
    images: ["/products/stingless-bee-puthka-honey-poster.png", "/products/jinlab-stingless-bee-puthka-honey.png"],
    rating_avg: 5.0,
    rating_count: 38,
    featured: true,
  },
  // 18. Black Ginger Capsules
  {
    id: "prod-black-ginger-018",
    slug: "jinlab-black-ginger-capsules",
    name: "Black Ginger Capsules",
    tagline: "Natural energy & vitality — carbon-negative Bhutan",
    description: "Kaempferia Parviflora rhizomes sustainably cultivated in Bhutan's pristine soil. Prized across the Himalayas for boosting energy, stamina, metabolic health, and physical endurance.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Bhutan",
    association_certified: true,
    certification_seal: "Pure Himalayan Kaempferia Parviflora",
    price_inr: 2500.00,
    price_usd: 30.00,
    price_aud: 45.00,
    price_eur: 28.00,
    price_gbp: 24.50,
    stock: 40,
    unit: "60 caps",
    badge: null,
    image_url: "/products/black-ginger-capsules-poster.png",
    images: ["/products/black-ginger-capsules-poster.png", "/products/jinlab-black-ginger-capsules.png"],
    rating_avg: 4.8,
    rating_count: 27,
    featured: true,
  },
  // 19. Jinlab Chirata Capsules
  {
    id: "prod-chirata-019",
    slug: "jinlab-chirata-capsules",
    name: "Jinlab Chirata Capsules",
    tagline: "Nature's bitter power for complete wellness",
    description: "Pure Swertia Chirayita whole-herb powder capsules. Harness the traditional bitter power of the Himalayas to help regulate metabolism, support digestion, and purify the blood.",
    category_id: "cat-wellness-006",
    categories: { slug: "wellness", name: "Wellness" },
    artisan_name: "Jinlab Agro Products",
    region_of_origin: "Tsirang, Bhutan",
    association_certified: true,
    certification_seal: "Sowa Rigpa Himalayan Bitter Herb",
    price_inr: 890.00,
    price_usd: 11.00,
    price_aud: 16.00,
    price_eur: 10.00,
    price_gbp: 8.80,
    stock: 50,
    unit: "60 caps",
    badge: "New",
    image_url: "/products/jinlab-chirata-capsules.png",
    rating_avg: 4.9,
    rating_count: 42,
    featured: true,
  },
  // 20. Paro Organic Red Rice (Grains & Cereals category)
  {
    id: "prod-red-rice-020",
    slug: "bhutan-organic-red-rice",
    name: "Bhutan Organic Paro Red Rice",
    tagline: "Heirloom glacier-fed whole grain rice from Paro Valley",
    description: "Semi-milled red rice irrigated by Himalayan glacial streams in Paro Valley. Naturally packed with potassium, magnesium, iron, and dietary fiber with a delicate nutty fragrance.",
    category_id: "cat-grains-001",
    categories: { slug: "grains-cereals", name: "Grains & Cereals" },
    artisan_name: "Paro Farmers Cooperative",
    region_of_origin: "Paro Valley, Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic by National Organic Programme",
    price_inr: 450.00,
    price_usd: 5.50,
    price_aud: 8.50,
    price_eur: 5.00,
    price_gbp: 4.50,
    stock: 90,
    unit: "1 kg",
    badge: "Heritage",
    image_url: "/src/assets/p-red-rice.jpg",
    rating_avg: 4.9,
    rating_count: 85,
    featured: false,
  },
  // 21. Himalayan Buckwheat Flour (Grains & Cereals category)
  {
    id: "prod-buckwheat-021",
    slug: "himalayan-buckwheat-flour",
    name: "Himalayan Buckwheat Flour",
    tagline: "Stone-ground tartary buckwheat from Bumthang Valley",
    description: "Traditional nutrient-dense whole grain tartary buckwheat flour stone-ground in Bumthang. High in rutin, dietary fiber, and protein. Ideal for hearty noodles, pancakes, and baking.",
    category_id: "cat-grains-001",
    categories: { slug: "grains-cereals", name: "Grains & Cereals" },
    artisan_name: "Bumthang Milling Guild",
    region_of_origin: "Bumthang, Bhutan",
    association_certified: true,
    certification_seal: "Himalayan Heritage Grain",
    price_inr: 320.00,
    price_usd: 4.00,
    price_aud: 6.00,
    price_eur: 3.50,
    price_gbp: 3.20,
    stock: 75,
    unit: "1 kg",
    badge: "Organic",
    image_url: "/src/assets/p-buckwheat.jpg",
    rating_avg: 4.8,
    rating_count: 34,
    featured: false,
  },
  // 22. High-Grown Samdrup Jongkhar Green Tea (Tea & Beverages category)
  {
    id: "prod-green-tea-022",
    slug: "bhutan-green-tea",
    name: "High-Grown Bhutan Green Tea",
    tagline: "Hand-picked whole-leaf mountain tea from Samdrup Jongkhar",
    description: "Organic whole green tea leaves tenderly harvested at 2,000m above sea level. Clean, fragrant, and rich in natural antioxidants with a sweet alpine finish.",
    category_id: "cat-tea-005",
    categories: { slug: "tea-beverages", name: "Tea & Beverages" },
    artisan_name: "Samdrup Jongkhar Tea Guild",
    region_of_origin: "Samdrup Jongkhar, Bhutan",
    association_certified: true,
    certification_seal: "Certified Organic Himalayan Tea",
    price_inr: 420.00,
    price_usd: 5.20,
    price_aud: 8.00,
    price_eur: 4.80,
    price_gbp: 4.20,
    stock: 60,
    unit: "100 g",
    badge: "Organic",
    image_url: "/src/assets/p-green-tea.jpg",
    rating_avg: 4.9,
    rating_count: 46,
    featured: false,
  },
  // 23. Sun-Dried Himalayan Shiitake Mushrooms (Dried Foods category)
  {
    id: "prod-shiitake-023",
    slug: "himalayan-shiitake-mushrooms",
    name: "Sun-Dried Himalayan Shiitake Mushrooms",
    tagline: "Wild-foraged forest oak shiitake from Bumthang",
    description: "Hand-harvested oak-grown shiitake mushrooms sun-dried naturally under clean mountain sunlight. Packed with deep umami flavor and beta-glucans for immunity and soups.",
    category_id: "cat-dried-004",
    categories: { slug: "dried-foods", name: "Dried Foods" },
    artisan_name: "Bumthang Agro Foragers",
    region_of_origin: "Bumthang, Bhutan",
    association_certified: true,
    certification_seal: "Wild Himalayan Foraged Produce",
    price_inr: 650.00,
    price_usd: 8.00,
    price_aud: 12.00,
    price_eur: 7.50,
    price_gbp: 6.50,
    stock: 45,
    unit: "150 g",
    badge: "Wild",
    image_url: "/src/assets/p-shiitake.jpg",
    rating_avg: 4.8,
    rating_count: 39,
    featured: false,
  },
  // 24. Himalayan Harvest Deluxe Gift Hamper (Gift Hampers category)
  {
    id: "prod-gift-hamper-024",
    slug: "himalayan-harvest-gift-hamper",
    name: "Himalayan Harvest Deluxe Gift Hamper",
    tagline: "Curated collection of Bhutan's finest agro & wellness treasures",
    description: "The ultimate Bhutanese gift hamper containing Jinlab Cordyceps Honey, Lakadong Turmeric Powder, High-Grown Green Tea, Paro Red Rice, and Traditional Ghee in a bespoke handcrafted box.",
    category_id: "cat-gifts-007",
    categories: { slug: "gift-hampers", name: "Gift Hampers" },
    artisan_name: "Takin Mart Curations",
    region_of_origin: "Thimphu, Bhutan",
    association_certified: true,
    certification_seal: "Official Takin Mart Gift Collection",
    price_inr: 5800.00,
    price_usd: 70.00,
    price_aud: 105.00,
    price_eur: 65.00,
    price_gbp: 57.00,
    stock: 20,
    unit: "Luxury Box",
    badge: "Luxury",
    image_url: "/src/assets/p-gift-hamper.jpg",
    rating_avg: 5.0,
    rating_count: 18,
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
      if (!error && data && data.length > 0) return data;
    } catch {
      // Fall through to fallback
    }
  }
  return FALLBACK_CATEGORIES;
});

const LEGACY_KEYWORDS = [
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

    // 1. Remove/deactivate all products matching legacy keywords
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

    // 3. Upsert authentic categories
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

    // 4. Upsert authentic 19 Jinlab products
    for (const p of FALLBACK_PRODUCTS) {
      const catSlug = p.categories?.slug || "wellness";
      const catId = catMap.get(catSlug) || null;
      await supabase.from("products").upsert(
        {
          name: p.name,
          slug: p.slug,
          tagline: p.tagline,
          description: p.description,
          price_inr: p.price_inr,
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
