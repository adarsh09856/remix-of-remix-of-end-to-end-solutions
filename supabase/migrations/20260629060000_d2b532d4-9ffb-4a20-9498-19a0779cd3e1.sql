
REVOKE ALL ON FUNCTION public.recompute_product_rating() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_order_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.decrement_stock_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
