CREATE OR REPLACE FUNCTION public.claim_admin_if_none()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    RETURN false;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (current_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_admin_if_none() TO authenticated;

DROP POLICY IF EXISTS "first user can claim admin" ON public.user_roles;
DROP POLICY IF EXISTS "Users can claim first admin" ON public.user_roles;

CREATE POLICY "admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS decrement_stock_on_paid_trigger ON public.orders;
CREATE TRIGGER decrement_stock_on_paid_trigger
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.decrement_stock_on_paid();