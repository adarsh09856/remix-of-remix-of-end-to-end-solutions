
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_in numeric(10,2),
  ADD COLUMN IF NOT EXISTS price_us numeric(10,2);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'BTN',
  ADD COLUMN IF NOT EXISTS country_code text NOT NULL DEFAULT 'BT';
