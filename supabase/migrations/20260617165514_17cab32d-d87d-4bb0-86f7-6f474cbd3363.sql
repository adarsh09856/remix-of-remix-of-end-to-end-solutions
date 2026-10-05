REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM anon;
REVOKE EXECUTE ON FUNCTION public.claim_admin_if_none() FROM authenticated;
DROP FUNCTION IF EXISTS public.claim_admin_if_none();