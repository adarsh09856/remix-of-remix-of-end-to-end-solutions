ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text, ADD COLUMN IF NOT EXISTS barcode text;
CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products (barcode);
CREATE INDEX IF NOT EXISTS products_sku_idx ON public.products (sku);

CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'open',
  opening_float numeric NOT NULL DEFAULT 0,
  closing_cash numeric,
  expected_cash numeric,
  difference numeric,
  note text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pos_sessions TO authenticated;
GRANT ALL ON public.pos_sessions TO service_role;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage pos sessions" ON public.pos_sessions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER pos_sessions_touch BEFORE UPDATE ON public.pos_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS cashier_id uuid,
  ADD COLUMN IF NOT EXISTS pos_session_id uuid REFERENCES public.pos_sessions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS amount_tendered numeric,
  ADD COLUMN IF NOT EXISTS change_due numeric,
  ADD COLUMN IF NOT EXISTS manual_discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS counter_note text;
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS orders_channel_idx ON public.orders (channel, created_at DESC);

CREATE TABLE IF NOT EXISTS public.pos_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  method text NOT NULL,
  amount numeric NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.pos_payments TO authenticated;
GRANT ALL ON public.pos_payments TO service_role;
ALTER TABLE public.pos_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage pos payments" ON public.pos_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS pos_payments_order_idx ON public.pos_payments (order_id);