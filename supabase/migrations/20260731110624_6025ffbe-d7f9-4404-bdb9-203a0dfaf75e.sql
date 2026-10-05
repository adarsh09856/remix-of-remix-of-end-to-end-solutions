CREATE OR REPLACE FUNCTION public.notify_on_order_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  t text; b text; l text;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    t := 'Order received';
    b := 'Your order #' || COALESCE(NEW.invoice_number, substr(NEW.id::text,1,8)) || ' has been received.';
    l := '/account/orders/' || NEW.id::text;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'order_placed', t, b, l);
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    t := CASE NEW.status
      WHEN 'paid' THEN 'Payment confirmed'
      WHEN 'shipped' THEN 'Order shipped'
      WHEN 'delivered' THEN 'Order delivered'
      WHEN 'cancelled' THEN 'Order cancelled'
      WHEN 'refunded' THEN 'Order refunded'
      ELSE 'Order updated'
    END;
    b := 'Order #' || COALESCE(NEW.invoice_number, substr(NEW.id::text,1,8)) || ' is now ' || NEW.status || '.';
    l := '/account/orders/' || NEW.id::text;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (NEW.user_id, 'order_' || NEW.status, t, b, l);
  END IF;
  RETURN NEW;
END $function$;