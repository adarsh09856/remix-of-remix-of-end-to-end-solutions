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

-- 13. Seed Categories & Products (Original Takin Mart Lovable Catalog)
INSERT INTO public.categories (name, slug, description, image_url, sort_order) VALUES
('Handicrafts', 'handicrafts', 'Sacred textiles, turned burl woodcraft, and artisan metalwork certified by the Handicraft Association of Bhutan.', '/src/assets/c-gifts.jpg', 1),
('Organic Products', 'organic-products', 'Heritage grains, Paro red rice, black cardamom, and certified organic mountain harvests.', '/src/assets/c-grains.jpg', 2),
('Traditional Foods', 'traditional-foods', 'Authentic Bhutanese Momo Chutney, mountain timur pepper, sun-dried chili condiments, and buckwheat noodles.', '/src/assets/c-spices.jpg', 3),
('Wellness & Herbal Products', 'wellness-herbal', 'Pure Himalayan raw wild honey, certified Lunana cordyceps sinensis, and high-altitude loose-leaf teas.', '/src/assets/c-wellness.jpg', 4),
('Gifts & Souvenirs', 'gifts-souvenirs', 'Bumthang Yathra bags, hand-turned wooden Dappa bowls, thangkas, and consecrated miniature Buddhist statues.', '/src/assets/c-gifts.jpg', 5)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order;

-- Remove non-authentic / Jinlab / legacy placeholder products if present
DELETE FROM public.products WHERE slug NOT IN (
  'bhutan-pure-wild-honey',
  'traditional-bhutanese-momo-chutney',
  'organic-red-rice-bhutan',
  'organic-black-cardamom-bhutan',
  'bhutan-green-tea-tin',
  'bumthang-yathra-handwoven-bag',
  'turned-wooden-dappa-bowl',
  'certified-lunana-wild-cordyceps',
  'himalayan-buckwheat-flour',
  'highland-finger-millet',
  'sun-dried-forest-shiitake',
  'cold-pressed-mustard-oil',
  'traditional-suja-butter-tea',
  'sun-dried-organic-red-chilies'
) OR slug LIKE 'jinlab-%'
  OR name ILIKE '%jinlab%'
  OR name ILIKE '%sichuan%'
  OR name ILIKE '%botanical%'
  OR name ILIKE '%mushroom medley%'
  OR name ILIKE '%pure agro%'
  OR name ILIKE '%lemongrass%'
  OR name ILIKE '%dallae ray%'
  OR name ILIKE '%takin cordyceps%'
  OR name ILIKE '%chitwan%'
  OR name ILIKE '%kingless%'
  OR name ILIKE '%traditional bhutanese dho%';

-- Remove non-authentic categories
DELETE FROM public.categories WHERE slug NOT IN (
  'handicrafts',
  'organic-products',
  'traditional-foods',
  'wellness-herbal',
  'gifts-souvenirs'
);

-- Insert Authentic Takin Mart Products
INSERT INTO public.products (name, slug, tagline, description, price_inr, compare_at_inr, unit, image_url, badge, stock, origin, is_active, category_id) VALUES
('Bhutan Pure Wild Honey (500g Jar)', 'bhutan-pure-wild-honey', 'Cold-extracted raw Himalayan cliff and wildflower honey', 'Featured in our Tshechu harvest collection. Harvested from wild bees foraging in pristine alpine flora at 2,800m altitude in Bumthang. Unfiltered, unpasteurized, and rich in natural mountain propolis and enzymes.', 2200, 2600, '500g jar', '/src/assets/p-honey.jpg', 'Tshechu Special', 45, 'Bumthang Valley, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness-herbal')),
('Traditional Bhutanese Momo Chutney (350g Jar)', 'traditional-bhutanese-momo-chutney', 'Fiery Druk red chilies, roasted garlic, and Himalayan mountain spices', 'The authentic taste of Bhutan''s kitchens, as featured in our Tshechu harvest flyer. Slow-cooked with heritage dried red chilies, native mountain timur (Sichuan pepper), roasted garlic, and Himalayan rock salt. Pairs perfectly with steamed dumplings, roasted meats, or rice dishes.', 650, 800, '350g jar', '/src/assets/p-chili-sauce.jpg', 'Best Seller', 60, 'Thimphu, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'traditional-foods')),
('Organic Bhutanese Red Rice (1kg Pouch)', 'organic-red-rice-bhutan', 'Glacier-irrigated heritage whole grain from Paro Valley', 'Shown prominently in our harvest flyer. Grown in mineral-dense soils fed by fresh snowmelt from Mt. Jomolhari. Semi-milled to leave behind the nutrient-rich red bran layer with high dietary fiber, iron, and a distinct nutty flavor.', 750, 900, '1kg pouch', '/src/assets/p-red-rice.jpg', '100% Organic', 80, 'Paro Valley, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'organic-products')),
('Organic Himalayan Black Cardamom (100g Pouch)', 'organic-black-cardamom-bhutan', 'Sun-dried smoky pods hand-harvested in subtropical Tsirang', 'Featured in our Tshechu harvest collection. Cultivated naturally under forest canopies in Tsirang and slowly wood-smoke dried over sweet hardwood embers. Imparts deep camphoraceous, woody complexity to traditional curries, stews, and warming herbal teas.', 540, 650, '100g pouch', '/src/assets/p-timur.jpg', 'Aromatic Spice', 50, 'Tsirang, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'organic-products')),
('Bhutan High-Altitude Green Tea (100g Emerald Tin)', 'bhutan-green-tea-tin', 'First-flush whole-leaf tea cultivated above the clouds in Trongsa', 'Presented in the distinctive emerald gift tin shown on our flyer. Handpicked from heritage bushes in Samdrup Choling, Trongsa at 2,200m elevation. Gently steamed and pan-fired to yield a delicate, sweet vegetal cup rich in antioxidants.', 1200, 1450, '100g tin', '/src/assets/p-green-tea.jpg', 'Emerald Tin', 70, 'Trongsa, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness-herbal')),
('Bumthang Yathra Handwoven Heritage Bag', 'bumthang-yathra-handwoven-bag', 'Ancestral geometric wool textile woven on Bumthang pedal looms', 'Shown on the left of our Tshechu harvest flyer. Crafted by master weavers in Chumey Valley from 100% pure Himalayan virgin wool, naturally dyed with walnut bark, indigo, and madder root. Finished with durable leather handles and brass fixtures.', 8500, 9800, 'bag', '/src/assets/p-gift-hamper.jpg', 'Handcrafted', 18, 'Bumthang Valley, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'handicrafts')),
('Turned Wooden Dappa Bowl & Cup Set', 'turned-wooden-dappa-bowl', 'Master Shagzo woodcraft turned from high-altitude maple burl', 'Carved and hand-turned by traditional woodturners in Trashiyangtse. The airtight nesting lids fit with such precise friction that Bhutanese travelers historically used them to carry hot buttered food without leaking.', 8800, 10500, 'set', '/src/assets/p-gift-hamper.jpg', 'Master Art', 22, 'Trashiyangtse, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'gifts-souvenirs')),
('Certified Genuine Wild Cordyceps Sinensis (Grade A - 10g)', 'certified-lunana-wild-cordyceps', 'Ethically gathered above 4,200m in Lunana with official government seal', 'The crown jewel of Himalayan agro-wellness. Wild-harvested by nomadic yak herders in the alpine heights of Lunana. Graded, verified, and sealed by the Department of Forests & Park Services, Royal Government of Bhutan.', 52000, 60000, '10g tin', '/src/assets/p-cordyceps.jpg', 'Rare Alpine', 12, 'Lunana, Gasa, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'wellness-herbal')),
('Himalayan Tartary Buckwheat Flour (1kg)', 'himalayan-buckwheat-flour', 'Stone-ground ancient grain from Bumthang Valley', 'Nutrient-dense, low-GI whole grain flour stone-milled in Bumthang. High in rutin, plant-based protein, and fiber. Ideal for traditional Himalayan buckwheat noodles (Puta) and wholesome pancakes.', 320, 400, '1kg pouch', '/src/assets/p-buckwheat.jpg', 'Organic', 75, 'Bumthang, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'organic-products')),
('Highland Finger Millet (1kg)', 'highland-finger-millet', 'Traditional calcium-rich Himalayan supergrain', 'Ancient heritage millet cultivated on terraced slopes in eastern Bhutan. Exceptionally high in calcium, iron, and dietary fiber. Naturally gluten-free and nutritious.', 280, 350, '1kg pouch', '/src/assets/p-millet.jpg', 'Supergrain', 60, 'Trashigang, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'organic-products')),
('Sun-Dried Forest Shiitake Mushrooms (150g)', 'sun-dried-forest-shiitake', 'Wild-foraged forest oak shiitake from Bumthang', 'Oak-log grown forest shiitake mushrooms harvested and sun-cured in alpine Bumthang. Deep earthy umami flavor, rich in beta-glucans for soups and braises.', 650, 780, '150g pack', '/src/assets/p-shiitake.jpg', 'Wild', 45, 'Bumthang, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'organic-products')),
('Cold-Pressed Bhutanese Mustard Oil (500ml)', 'cold-pressed-mustard-oil', 'Single-origin wood-pressed mustard oil with pungent aroma', 'Traditional wood-pressed kachi-ghani mustard oil pressed from heritage seeds grown in Punakha Valley. High smoke point and authentic robust punch essential to Himalayan cooking.', 380, 450, '500ml bottle', '/src/assets/p-mustard-oil.jpg', 'Cold-Pressed', 55, 'Punakha, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'traditional-foods')),
('Traditional Suja Butter Tea Brick (250g)', 'traditional-suja-butter-tea', 'Fermented mountain tea brick for authentic Bhutanese butter tea', 'Compressed fermented whole tea brick cured according to centuries-old Bhutanese monastery methods. Churned with yak butter and salt to create nourishing, warming Suja.', 450, 550, '250g brick', '/src/assets/p-suja.jpg', 'Heritage', 50, 'Trongsa, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'traditional-foods')),
('Sun-Dried Organic Bhutanese Red Chilies (200g)', 'sun-dried-organic-red-chilies', 'Naturally roof-dried fiery chilies from Punakha', 'Whole sun-dried red chilies cured on traditional farmhouse roofs across Punakha. The irreplaceable soul of Ema Datshi and Bhutanese culinary heritage.', 340, 420, '200g pouch', '/src/assets/p-dried-chilies.jpg', 'Organic', 65, 'Punakha, Bhutan', true, (SELECT id FROM public.categories WHERE slug = 'traditional-foods'))
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_inr = EXCLUDED.price_inr,
  compare_at_inr = EXCLUDED.compare_at_inr,
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
