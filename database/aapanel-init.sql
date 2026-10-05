-- =========================================================================
-- TAKINMART E-COMMERCE PLATFORM — UNIFIED AAPANEL POSTGRESQL INITIALIZATION
-- =========================================================================
-- Run this script in aaPanel PostgreSQL Manager / phpPgAdmin / psql
-- It provisions all tables, roles, triggers, and seed catalog items.
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. App Roles & Users
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- 2. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  tagline TEXT,
  description TEXT,
  price_inr NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT '1 piece',
  image_url TEXT,
  gallery JSONB DEFAULT '[]'::jsonb,
  badge TEXT,
  stock INT NOT NULL DEFAULT 100,
  origin TEXT DEFAULT 'Bhutan',
  is_active BOOLEAN NOT NULL DEFAULT true,
  artisan_name TEXT,
  dzongkhag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Addresses
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 7. Orders & Order Items
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  guest_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  total_inr NUMERIC(10,2) NOT NULL,
  shipping_address JSONB NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'card',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  invoice_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price_inr NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  line_total_inr NUMERIC(10,2) NOT NULL
);

-- 8. Coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_inr NUMERIC(10,2) DEFAULT 0,
  max_discount_inr NUMERIC(10,2),
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ,
  usage_limit INT,
  times_used INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Reviews & Wishlist
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_buyer BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 10. Notifications & App Settings
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. CRM & POS Systems
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'new',
  deal_value_inr NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_by UUID,
  opening_cash NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- 12. Permissions & Security (Works on both Supabase & Standard PostgreSQL)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (is_active = true);
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (status = 'approved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 13. Seed Categories & Products
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
('Grains & Cereals', 'grains-cereals', 'Heritage Bhutanese red rice, tartary buckwheat, and high-altitude mountain grains grown sustainably.', '/src/assets/c-grains.jpg', 1),
('Wild Honey', 'wild-honey', 'Raw, unprocessed multi-flora, cordyceps, and stingless-bee Puthka honey from Bhutan''s pristine forests.', '/src/assets/c-honey.jpg', 2),
('Spices & Condiments', 'spices-condiments', 'High-curcumin Lakadong turmeric, fiery Dalle chillies, mountain ghee, and traditional handmade pickles.', '/src/assets/c-spices.jpg', 3),
('Dried Foods', 'dried-foods', 'Artisanal avocado and kiwi jams, sun-dried wild shiitake mushrooms, and mountain fruits.', '/src/assets/c-dried.jpg', 4),
('Tea & Beverages', 'tea-beverages', 'High-grown organic green teas, cordyceps herbal infusions, and traditional Himalayan teas.', '/src/assets/c-tea.jpg', 5),
('Wellness', 'wellness', 'Pure Himalayan shilajit, organic black turmeric, chirata, beetroot, and vitality herbal supplements.', '/src/assets/c-wellness.jpg', 6),
('Gift Hampers', 'gift-hampers', 'Curated gift collections of authentic Bhutanese agro and wellness treasures for discerning recipients.', '/src/assets/c-gifts.jpg', 7)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order;

-- Insert Jinlab Authentic Products
INSERT INTO public.products (name, slug, tagline, description, price_inr, unit, image_url, badge, stock, origin, is_active, category_id) VALUES
('Golden Trio Capsules', 'jinlab-golden-trio-capsules', 'Turmeric · Ginger · Black Pepper blend', 'Synergistic botanical blend of organic Lakadong turmeric, highland ginger, and black pepper. Formulated to enhance bioavailability and provide daily anti-inflammatory and antioxidant support. Grown in carbon-negative Bhutan.', 2100, '60 capsules', '/products/golden-trio-capsules-poster.png', 'New', 45, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Organic Lakadong Turmeric Powder', 'jinlab-lakadong-turmeric-powder', 'High curcumin content 7–9% · Certified organic', 'Pure, high-potency Lakadong turmeric powder cultivated organically in the mineral-rich soils of Bhutan. Renowned for its exceptionally high curcumin content (7–9%) and vibrant golden color.', 399, '250g jar', '/products/lakadong-turmeric-powder-poster.png', 'New', 60, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'spices-condiments')),
('Traditional Bhutan Ghee', 'jinlab-bhutan-ghee', 'Pure Himalayan ghee · Rich in A2 Beta-Casein', 'Hand-churned Himalayan butter rendered into aromatic, golden ghee using age-old Bhutanese dairy traditions. Naturally rich in A2 beta-casein, essential fat-soluble vitamins, and healthy omega fatty acids.', 1650, '500g jar', '/products/bhutan-ghee-poster.png', 'New', 35, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'spices-condiments')),
('Dalle Dry Fish Pickle', 'jinlab-dalle-dry-fish-pickle', 'A timeless Bhutanese favourite', 'Authentic Bhutanese artisan pickle combining fiery round Dalle chillies with traditionally cured dry fish, cold-pressed mustard oil, and mountain spices. Robust and savory.', 480, '200 g', '/products/jinlab-dalle-dry-fish-pickle.png', NULL, 40, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'spices-condiments')),
('Jinlab Cordyceps Honey', 'jinlab-cordyceps-honey', 'Pure natural premium honey with cordyceps', 'Raw Himalayan wildflower honey masterfully infused with authentic high-altitude Cordyceps Sinensis. An exquisite vitality tonic supporting immunity, stamina, and respiratory health.', 1490, '250 g', '/products/jinlab-cordyceps-honey.png', 'Premium', 25, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wild-honey')),
('Himalayan Cordyceps Herbal Tea', 'jinlab-himalayan-cordyceps-herbal-tea', 'Premium herbs, sustainably sourced', 'A restorative herbal infusion blending wild Cordyceps Sinensis with Bhutanese highland herbs. Naturally caffeine-free, offering a soothing, earthy finish. Packed in 20 sachets.', 890, '30 g', '/products/jinlab-cordyceps-tea-front.png', 'New', 50, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'tea-beverages')),
('Dalle Garlic Pickle', 'jinlab-dalle-garlic-pickle', 'A timeless Bhutanese favourite', 'Whole garlic cloves pickled with native Dalle cherry chillies in mustard oil and Himalayan aromatic seeds. A quintessential accompaniment to red rice and hearty stews.', 350, '200 g', '/products/jinlab-dalle-garlic-pickle.png', NULL, 55, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'spices-condiments')),
('Jinlab Beetroot Capsules', 'jinlab-beetroot-capsules', 'Natural energy and vitality support', 'Pure organic Bhutanese beetroot dehydrated at low temperatures and encapsulated. Rich in natural dietary nitrates, iron, and antioxidants to support endurance and healthy blood flow.', 790, '60 caps', '/products/jinlab-beetroot-capsules-front.png', 'New', 45, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Fire Balls Dalle Paste Pickle', 'jinlab-fire-balls-dalle-paste-pickle', 'Hot spicy cherry pepper paste', 'Crushed fiery Dalle cherry peppers slow-cooked into an intense spicy paste with Himalayan spices. The ultimate condiment for heat-lovers, momos, and traditional noodle soups.', 450, '200 g', '/products/jinlab-fire-balls-dalle-paste-pickle.png', 'Hot', 35, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'spices-condiments')),
('Jinlab Avocado Jam', 'jinlab-avocado-jam', '60% pure Bhutanese avocados · Artisanal fruit spread', 'Artisanal, nutrient-dense fruit spread crafted from 60% fresh subtropical avocados grown organically in Tsirang, Bhutan. Mildly sweet, smooth, and delicious on sourdough toast.', 2500, '220 g', '/products/avocado-jam-poster.png', NULL, 30, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'dried-foods')),
('Chirata Detox Capsules', 'jinlab-chirata-detox-capsules', 'The extra from the Himalayas', 'High-potency Swertia Chirayita extract encapsulated for convenient daily detox. Revered in traditional Sowa Rigpa medicine for liver cleansing, bile stimulation, and immune support.', 990, '60 caps', '/products/jinlab-chirata-detox-capsules.png', 'Premium', 40, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Organic Turmeric Capsules', 'jinlab-organic-turmeric-capsules', 'Curcuma Longa — pure Bhutanese turmeric', 'Pure single-origin Curcuma Longa grown in the pristine valleys of Bhutan. 100% plant-based pullulan capsules designed for joint flexibility, radiant skin, and gut health.', 720, '60 caps', '/products/jinlab-organic-turmeric-capsules.png', 'Organic', 60, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Natural Red Kiwi Jam', 'jinlab-natural-red-kiwi-jam', 'Homemade red kiwi jam from Bhutan', 'Small-batch preserve made from rare red-fleshed kiwis grown in southern Bhutan. Naturally rich in vitamin C and polyphenols with an exquisite berry-like tang.', 560, '220 g', '/products/jinlab-natural-red-kiwi-jam.png', NULL, 40, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'dried-foods')),
('Organic Black Turmeric Capsules', 'jinlab-organic-black-turmeric-capsules', 'Cucurma Caesia — the rare black turmeric', 'The rarest Himalayan rhizome — Cucurma Caesia with its dark bluish-black interior. Prized for its intense anti-inflammatory properties, respiratory support, and high antioxidant levels.', 1290, '60 caps', '/products/jinlab-organic-black-turmeric-capsules.png', 'Rare', 30, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Premium Multi Flora Honey', 'jinlab-premium-multi-flora-honey', 'Pure, raw and unfiltered — native Apis cerana bees', 'Raw, unprocessed mountain honey gathered by native Apis cerana bees foraging on wildflowers in the high-altitude forests of Bumthang. Unfiltered, enzyme-rich, and pure.', 850, '250g jar', '/products/multi-flora-honey-poster.png', 'Bestseller', 65, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wild-honey')),
('Pure Himalayan Bhutanese Shilajit', 'jinlab-bhutanese-shilajit', 'Rich in fulvic & humic acids · High-altitude sourced', 'Pure grade-A Himalayan Shilajit resin harvested at over 4,500m elevation. Purified using traditional herbal decoctions, containing over 85 trace minerals and 70%+ fulvic acid.', 1700, '20 g', '/products/bhutanese-shilajit-poster.png', 'Premium', 35, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Stingless-Bee Puthka Honey', 'jinlab-stingless-bee-puthka-honey', 'Rare Puthka Honey · High-altitude, antioxidant-rich', 'The legendary Puthka honey from Bhutan''s stingless Meliponini bees. Tangy, slightly citrusy, and renowned for extraordinary antimicrobial and tissue healing properties.', 2500, '100 ml', '/products/stingless-bee-puthka-honey-poster.png', 'Rare', 20, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wild-honey')),
('Black Ginger Capsules', 'jinlab-black-ginger-capsules', 'Natural energy & vitality — carbon-negative Bhutan', 'Kaempferia Parviflora rhizomes sustainably cultivated in Bhutan''s pristine soil. Prized across the Himalayas for boosting energy, stamina, metabolic health, and physical endurance.', 2500, '60 caps', '/products/black-ginger-capsules-poster.png', NULL, 40, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness')),
('Jinlab Chirata Capsules', 'jinlab-chirata-capsules', 'Nature''s bitter power for complete wellness', 'Pure Swertia Chirayita whole-herb powder capsules. Harness the traditional bitter power of the Himalayas to help regulate metabolism, support digestion, and purify the blood.', 890, '60 caps', '/products/jinlab-chirata-capsules.png', 'New', 50, 'Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness'))
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_inr = EXCLUDED.price_inr,
  unit = EXCLUDED.unit,
  image_url = EXCLUDED.image_url,
  badge = EXCLUDED.badge,
  stock = EXCLUDED.stock,
  origin = EXCLUDED.origin,
  is_active = true;

INSERT INTO public.coupons (code, discount_type, discount_value, min_order_inr, is_active) VALUES
('WELCOME10', 'percentage', 10.00, 500, true),
('BHUTAN2026', 'percentage', 15.00, 1000, true),
('TAKINFEST', 'fixed', 500.00, 2500, true)
ON CONFLICT (code) DO NOTHING;
