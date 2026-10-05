
-- 1. Tracking fields on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS courier TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery DATE,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Allow customer to cancel their own pending orders
DROP POLICY IF EXISTS "Users can cancel own pending orders" ON public.orders;
CREATE POLICY "Users can cancel own pending orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status IN ('pending','cancelled'));

-- 3. Admin can manage categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Stock auto-decrement on paid status
CREATE OR REPLACE FUNCTION public.decrement_stock_on_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    UPDATE public.products p
    SET stock = GREATEST(0, p.stock - oi.quantity)
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id AND oi.product_id = p.id;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orders_decrement_stock ON public.orders;
CREATE TRIGGER trg_orders_decrement_stock
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_paid();
