-- Đề xuất và xác nhận tọa độ mộ phần qua Google Maps
CREATE TABLE IF NOT EXISTS public.burial_location_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  maps_url TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  note TEXT,
  submitted_by_name TEXT,
  submitted_by_contact TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_burial_submissions_status_created ON public.burial_location_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_burial_submissions_member ON public.burial_location_submissions(member_id);
ALTER TABLE public.burial_location_submissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public can submit burial suggestions" ON public.burial_location_submissions;
CREATE POLICY "public can submit burial suggestions" ON public.burial_location_submissions FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
DROP POLICY IF EXISTS "admins can view burial suggestions" ON public.burial_location_submissions;
CREATE POLICY "admins can view burial suggestions" ON public.burial_location_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.clan_users cu WHERE cu.auth_user_id = auth.uid() AND cu.status = 'active' AND cu.role IN ('super_admin','branch_admin','editor')));
DROP POLICY IF EXISTS "admins can review burial suggestions" ON public.burial_location_submissions;
CREATE POLICY "admins can review burial suggestions" ON public.burial_location_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.clan_users cu WHERE cu.auth_user_id = auth.uid() AND cu.status = 'active' AND cu.role IN ('super_admin','branch_admin','editor'))) WITH CHECK (status IN ('approved','rejected','pending'));
NOTIFY pgrst, 'reload schema';
