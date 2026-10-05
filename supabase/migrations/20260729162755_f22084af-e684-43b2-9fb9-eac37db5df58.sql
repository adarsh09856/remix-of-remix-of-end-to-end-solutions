ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS compare_at_inr numeric,
  ADD COLUMN IF NOT EXISTS compare_at_in numeric,
  ADD COLUMN IF NOT EXISTS compare_at_us numeric,
  ADD COLUMN IF NOT EXISTS allow_backorder boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS paypal_capture_id text;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(_coupon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.coupons SET used_count = used_count + 1 WHERE id = _coupon_id;
$$;

GRANT EXECUTE ON FUNCTION public.increment_coupon_usage(uuid) TO authenticated, service_role;