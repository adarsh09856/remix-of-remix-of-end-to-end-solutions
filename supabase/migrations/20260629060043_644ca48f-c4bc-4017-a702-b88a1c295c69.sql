
CREATE POLICY "Public read products bucket" ON storage.objects FOR SELECT
  USING (bucket_id = 'products');
CREATE POLICY "Admin write products bucket" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin update products bucket" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'products' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin delete products bucket" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'products' AND public.has_role(auth.uid(),'admin'));
