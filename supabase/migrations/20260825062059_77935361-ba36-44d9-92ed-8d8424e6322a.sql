CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  source text NOT NULL DEFAULT 'manual',
  status text NOT NULL DEFAULT 'new',
  value_inr numeric NOT NULL DEFAULT 0,
  owner_id uuid,
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage leads" ON public.crm_leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER crm_leads_touch BEFORE UPDATE ON public.crm_leads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.crm_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  reply text,
  handled_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.crm_enquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_enquiries TO authenticated;
GRANT ALL ON public.crm_enquiries TO service_role;
ALTER TABLE public.crm_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit an enquiry" ON public.crm_enquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read enquiries" ON public.crm_enquiries FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update enquiries" ON public.crm_enquiries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete enquiries" ON public.crm_enquiries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER crm_enquiries_touch BEFORE UPDATE ON public.crm_enquiries FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  details text,
  due_date date,
  priority text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'open',
  assignee_id uuid,
  related_type text,
  related_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_tasks TO authenticated;
GRANT ALL ON public.crm_tasks TO service_role;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage tasks" ON public.crm_tasks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER crm_tasks_touch BEFORE UPDATE ON public.crm_tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.crm_customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  body text NOT NULL,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_customer_notes TO authenticated;
GRANT ALL ON public.crm_customer_notes TO service_role;
ALTER TABLE public.crm_customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customer notes" ON public.crm_customer_notes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.crm_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.crm_activity TO authenticated;
GRANT ALL ON public.crm_activity TO service_role;
ALTER TABLE public.crm_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read activity" ON public.crm_activity FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins write activity" ON public.crm_activity FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX crm_leads_status_idx ON public.crm_leads (status, created_at DESC);
CREATE INDEX crm_enquiries_status_idx ON public.crm_enquiries (status, created_at DESC);
CREATE INDEX crm_tasks_status_idx ON public.crm_tasks (status, due_date);
CREATE INDEX crm_customer_notes_customer_idx ON public.crm_customer_notes (customer_id, created_at DESC);