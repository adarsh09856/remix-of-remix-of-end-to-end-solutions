REVOKE EXECUTE ON FUNCTION public.decrement_stock_on_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_stock_on_paid() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;