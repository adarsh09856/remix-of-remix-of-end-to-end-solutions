UPDATE public.products SET
  image_url = '/__l5e/assets-v1/47236195-1b7b-46c5-a3a4-8e64016c129d/jinlab-chirata-capsules.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Chirata capsules made from Chirata extract and positioned as a natural wellness supplement. The packaging highlights detox support, digestive balance and traditional Himalayan herbal use. Packaged by Jinlab Agro Products in Tsirang, Bhutan.',
  unit = '60 caps',
  origin = 'Bhutan'
WHERE slug = 'jinlab-chirata-capsules';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/41862bef-adb1-409d-9b9f-e94f9c68ac07/jinlab-premium-multi-flora-honey.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Premium multi flora honey from native bees, presented as a pure Bhutan product. A naturally sweet table honey suitable for breakfast, tea and everyday use.',
  unit = '250 g',
  origin = 'Bhutan'
WHERE slug = 'jinlab-premium-multi-flora-honey';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/4cd34cbb-74b1-4e0b-94c7-28100d87f6e6/jinlab-avocado-jam.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Avocado jam made with 60% pure avocado and labelled as a homemade product of Bhutan. A smooth fruit spread with a mild, creamy profile for toast, breakfast boards and desserts.',
  unit = '220 g',
  origin = 'Bhutan'
WHERE slug = 'jinlab-avocado-jam';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/20be7d5b-6d31-4d7f-9332-5049acfc85ae/jinlab-organic-turmeric-capsules.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Organic turmeric capsules made from Curcuma longa and sold as a Bhutan wellness product. Designed for customers looking for a simple capsule format for daily turmeric intake.',
  unit = '60 caps',
  origin = 'Bhutan'
WHERE slug = 'jinlab-organic-turmeric-capsules';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/ec7fc230-6663-45dc-a0de-96d583f5397e/jinlab-chirata-detox-capsules.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Chirata detox capsules presented as a Himalayan herbal wellness product from Bhutan. The packaging emphasizes complete wellness and the traditional bitter-herb profile of Chirata.',
  unit = '60 caps',
  origin = 'Bhutan'
WHERE slug = 'jinlab-chirata-detox-capsules';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/bfcfa0f1-293f-416c-ab5b-c2277009597a/jinlab-stingless-bee-puthka-honey.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Stingless-bee Puthka honey from Bhutan, presented as an exotic small-batch honey. A specialty honey product for gifting, tasting and premium pantry use.',
  unit = '100 ml',
  origin = 'Bhutan'
WHERE slug = 'jinlab-stingless-bee-puthka-honey';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/2da31370-f539-40e8-aa1d-bce8183e77d3/jinlab-natural-red-kiwi-jam.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Natural red kiwi jam labelled as a homemade product of Bhutan. A bright fruit preserve for toast, bakery use and breakfast service.',
  unit = '220 g',
  origin = 'Bhutan'
WHERE slug = 'jinlab-natural-red-kiwi-jam';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/2f7ea6b6-d19e-41ca-aa7d-fc1411bb9295/jinlab-bhutanese-shilajit.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Pure Himalayan Bhutanese Shilajit presented in a compact jar. Positioned as a premium Bhutan wellness product for customers seeking a high-value traditional supplement.',
  unit = '20 g',
  origin = 'Bhutan'
WHERE slug = 'jinlab-bhutanese-shilajit';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/81e0daab-d86e-4d3b-ac96-d41d61210fc3/jinlab-black-ginger-capsules.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Black ginger capsules made from Kaempferia parviflora and presented as a Bhutan product. A capsule-format wellness item aimed at daily supplement buyers.',
  unit = '60 caps',
  origin = 'Bhutan'
WHERE slug = 'jinlab-black-ginger-capsules';

UPDATE public.products SET
  image_url = '/__l5e/assets-v1/9fa8c466-c4e2-4d1d-b357-ca6f504e4c4f/jinlab-organic-black-turmeric-capsules.png',
  gallery = '[]'::jsonb,
  images = '[]'::jsonb,
  description = 'Organic black turmeric capsules made from Curcuma caesia and packaged as a Bhutan wellness product. A rare turmeric variant in an easy daily capsule form.',
  unit = '60 caps',
  origin = 'Bhutan'
WHERE slug = 'jinlab-organic-black-turmeric-capsules';

INSERT INTO public.products (name, slug, tagline, description, price_inr, unit, image_url, gallery, images, badge, stock, origin, is_active, active, featured, category_id)
VALUES
(
  'Jinlab Cordyceps Honey',
  'jinlab-cordyceps-honey',
  'Pure natural premium honey with cordyceps',
  'Cordyceps honey in a glass jar, presented as a premium natural product of Bhutan. A specialty honey positioned for gifting, wellness-focused customers and premium pantry shelves.',
  1490,
  '250 g',
  '/__l5e/assets-v1/cbb40424-4562-4a0b-8ad5-136ae482eb4a/jinlab-cordyceps-honey.png',
  '[]'::jsonb,
  '[]'::jsonb,
  'Premium',
  24,
  'Bhutan',
  true,
  true,
  false,
  '1358c523-f65b-4e60-9107-1b6c090dbb9c'
),
(
  'Himalayan Cordyceps Herbal Tea',
  'jinlab-himalayan-cordyceps-herbal-tea',
  'Premium herbs, sustainably sourced',
  'Himalayan cordyceps herbal tea by Jinlab, packed in 20 sachets. The uploaded photos include the front, manufacturer panel and back brand-story panel, so customers can inspect the full pack before buying.',
  890,
  '30 g',
  '/__l5e/assets-v1/8fcbbe05-174e-4875-a948-776131724e84/jinlab-cordyceps-tea-front.png',
  '["/__l5e/assets-v1/8fcbbe05-174e-4875-a948-776131724e84/jinlab-cordyceps-tea-front.png","/__l5e/assets-v1/40ba2a1a-c321-483e-82e4-0ff0dc3faa9e/jinlab-cordyceps-tea-side.png","/__l5e/assets-v1/2a89a7c4-f51a-4c4a-8c59-22b587703762/jinlab-cordyceps-tea-back.png"]'::jsonb,
  '["/__l5e/assets-v1/8fcbbe05-174e-4875-a948-776131724e84/jinlab-cordyceps-tea-front.png","/__l5e/assets-v1/40ba2a1a-c321-483e-82e4-0ff0dc3faa9e/jinlab-cordyceps-tea-side.png","/__l5e/assets-v1/2a89a7c4-f51a-4c4a-8c59-22b587703762/jinlab-cordyceps-tea-back.png"]'::jsonb,
  'New',
  30,
  'Bhutan',
  true,
  true,
  false,
  'eada1647-267a-4aeb-a9c5-7ba9e843fc7f'
),
(
  'Jinlab Beetroot Capsules',
  'jinlab-beetroot-capsules',
  'Natural energy and vitality support',
  'Beetroot capsules made from 100% beetroot powder with no additives, shown with multiple uploaded pack views including front and nutrition panel. A capsule-format Bhutan wellness product for daily supplement customers.',
  790,
  '60 caps',
  '/__l5e/assets-v1/911ce462-5489-40c6-8b5c-a5aef20b86ed/jinlab-beetroot-capsules-front.png',
  '["/__l5e/assets-v1/911ce462-5489-40c6-8b5c-a5aef20b86ed/jinlab-beetroot-capsules-front.png","/__l5e/assets-v1/177c71e4-85d2-403e-9790-9155219d5816/jinlab-beetroot-capsules-front-info.png","/__l5e/assets-v1/d99908bc-6e29-48b4-87e9-6c780ce1b8df/jinlab-beetroot-capsules-nutrition.png"]'::jsonb,
  '["/__l5e/assets-v1/911ce462-5489-40c6-8b5c-a5aef20b86ed/jinlab-beetroot-capsules-front.png","/__l5e/assets-v1/177c71e4-85d2-403e-9790-9155219d5816/jinlab-beetroot-capsules-front-info.png","/__l5e/assets-v1/d99908bc-6e29-48b4-87e9-6c780ce1b8df/jinlab-beetroot-capsules-nutrition.png"]'::jsonb,
  'New',
  30,
  'Bhutan',
  true,
  true,
  false,
  'c366cd79-b028-491f-9dbf-d7623c32b0bc'
),
(
  'Dalle Garlic Pickle',
  'jinlab-dalle-garlic-pickle',
  'A timeless Bhutanese favourite',
  'Dalle garlic pickle in a stand-up pouch. The uploaded pack shows garlic, dalle chilli and spices, positioned as a traditional Bhutanese pickle with no artificial preservatives.',
  420,
  '200 g',
  '/__l5e/assets-v1/c9663f23-c9c8-4845-9263-deff6bb7633f/jinlab-dalle-garlic-pickle.png',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL,
  40,
  'Bhutan',
  true,
  true,
  false,
  'c436e12d-dbe1-45d1-bbe4-65eae313f50f'
),
(
  'Fire Balls Dalle Paste Pickle',
  'jinlab-fire-balls-dalle-paste-pickle',
  'Hot spicy cherry pepper paste',
  'Fire Balls Dalle Paste Pickle in a stand-up pouch, shown in the uploaded real product pack. A bold Bhutanese chilli pickle for condiments, rice meals and spicy accompaniments.',
  450,
  '200 g',
  '/__l5e/assets-v1/75c4ee59-b3da-44b8-9a13-80a999fd4828/jinlab-fire-balls-dalle-paste-pickle.png',
  '[]'::jsonb,
  '[]'::jsonb,
  'Hot',
  36,
  'Bhutan',
  true,
  true,
  false,
  'c436e12d-dbe1-45d1-bbe4-65eae313f50f'
),
(
  'Dalle Dry Fish Pickle',
  'jinlab-dalle-dry-fish-pickle',
  'A timeless Bhutanese favourite',
  'Dalle dry fish pickle in a stand-up pouch, combining chilli paste, dry fish, oil, ginger and spices as shown on the uploaded pack. A bold, savoury Bhutanese pantry item for rice and side dishes.',
  480,
  '200 g',
  '/__l5e/assets-v1/a977058c-0aca-4663-8f1a-5d0b8a0395f9/jinlab-dalle-dry-fish-pickle.png',
  '[]'::jsonb,
  '[]'::jsonb,
  NULL,
  32,
  'Bhutan',
  true,
  true,
  false,
  'c436e12d-dbe1-45d1-bbe4-65eae313f50f'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  price_inr = EXCLUDED.price_inr,
  unit = EXCLUDED.unit,
  image_url = EXCLUDED.image_url,
  gallery = EXCLUDED.gallery,
  images = EXCLUDED.images,
  badge = EXCLUDED.badge,
  stock = EXCLUDED.stock,
  origin = EXCLUDED.origin,
  is_active = EXCLUDED.is_active,
  active = EXCLUDED.active,
  featured = EXCLUDED.featured,
  category_id = EXCLUDED.category_id;