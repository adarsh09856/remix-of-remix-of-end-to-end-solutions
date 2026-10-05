DROP TRIGGER IF EXISTS decrement_stock_on_paid_trigger ON public.orders;
DROP TRIGGER IF EXISTS trg_orders_decrement_stock ON public.orders;

CREATE TRIGGER trg_orders_decrement_stock
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_paid();