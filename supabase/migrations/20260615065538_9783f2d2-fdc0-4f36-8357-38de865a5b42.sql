ALTER FUNCTION public.has_role(uuid, app_role) SECURITY INVOKER;
DROP FUNCTION IF EXISTS public.claim_first_admin();

GRANT INSERT ON public.user_roles TO authenticated;
DROP POLICY IF EXISTS "first user can claim admin" ON public.user_roles;
CREATE POLICY "first user can claim admin"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'admin');

CREATE UNIQUE INDEX IF NOT EXISTS one_bootstrap_admin_role
  ON public.user_roles (role)
  WHERE role = 'admin';